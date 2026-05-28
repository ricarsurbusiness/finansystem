package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
)

var (
	ErrSesionNotFound       = errors.New("sesión no encontrada")
	ErrSesionCerrada        = errors.New("la sesión ya está cerrada")
	ErrSesionAbierta        = errors.New("ya existe una sesión abierta para hoy")
	ErrUnauthorized         = errors.New("no autorizado")
	ErrMaxModificaciones    = errors.New("se alcanzó el límite máximo de modificaciones (3)")
	ErrSesionNoCerrada      = errors.New("la sesión no está cerrada")
	ErrSesionConMovimientos = errors.New("no se puede eliminar una sesión con movimientos")
)

// getLocation retorna la ubicación (timezone) a partir del string
// Si no es válida, retorna UTC por defecto
func getLocation(timezone string) *time.Location {
	if timezone == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return time.UTC
	}
	return loc
}

type SesionService struct {
	sesionRepo     ports.SesionRepository
	movimientoRepo ports.MovimientoRepository
	refuerzoRepo   ports.RefuerzoRepository
}

func NewSesionService(
	sesionRepo ports.SesionRepository,
	movimientoRepo ports.MovimientoRepository,
	refuerzoRepo ports.RefuerzoRepository,
) *SesionService {
	return &SesionService{
		sesionRepo:     sesionRepo,
		movimientoRepo: movimientoRepo,
		refuerzoRepo:   refuerzoRepo,
	}
}

type CrearSesionInput struct {
	UsuarioID   uuid.UUID
	BaseInicial float64
	Fecha       *time.Time
}

type CerrarSesionInput struct {
	UsuarioID     uuid.UUID
	SesionID      uuid.UUID
	EfectivoFinal float64
	BaseSiguiente float64
}

// CrearSesion crea una nueva sesión diaria
func (s *SesionService) CrearSesion(input CrearSesionInput) (*entities.SesionResponse, error) {
	// Verificar si ya hay una sesión abierta para hoy
	loc := getLocation("America/Bogota")
	fecha := time.Now().In(loc)
	if input.Fecha != nil {
		fecha = *input.Fecha
	}

	// Normalizar fecha
	fecha = time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, loc)

	// Verificar sesión abierta
	abierta, _ := s.sesionRepo.FindAbiertaByUsuario(input.UsuarioID)
	if abierta != nil {
		return nil, ErrSesionAbierta
	}

	sesion := &entities.SesionDiaria{
		UsuarioID:     input.UsuarioID,
		Fecha:         fecha,
		BaseInicial:   input.BaseInicial,
		Refuerzos:     0,
		EfectivoFinal: 0,
		BaseSiguiente: 0,
		Estado:        entities.SesionAbierta,
	}

	err := s.sesionRepo.Create(sesion)
	if err != nil {
		return nil, err
	}

	return sesion.ToResponse(0, 0), nil
}

// ObtenerSesion obtiene una sesión por ID
func (s *SesionService) ObtenerSesion(sesionID, usuarioID uuid.UUID) (*entities.SesionResponse, error) {
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return nil, ErrUnauthorized
	}

	return sesion.ToResponse(0, 0), nil
}

// ObtenerSesiones obtiene todas las sesiones del usuario
func (s *SesionService) ObtenerSesiones(usuarioID uuid.UUID) ([]entities.SesionResponse, error) {
	sesiones, err := s.sesionRepo.FindByUsuario(usuarioID)
	if err != nil {
		return nil, err
	}

	resp := make([]entities.SesionResponse, len(sesiones))
	for i, sesion := range sesiones {
		// Calcular totales de movimientos solo si la sesión está cerrada
		var totalProveedor, totalGasto float64
		if sesion.Estado == entities.SesionCerrada {
			movimientos, _ := s.movimientoRepo.FindBySesion(sesion.ID)
			for _, m := range movimientos {
				if m.Categoria == entities.CategoriaProveedor {
					totalProveedor += m.Monto
				} else {
					totalGasto += m.Monto
				}
			}
		}
		resp[i] = *sesion.ToResponse(totalProveedor, totalGasto)
	}

	return resp, nil
}

// ObtenerSesionAbierta obtiene la sesión abierta del usuario
func (s *SesionService) ObtenerSesionAbierta(usuarioID uuid.UUID) (*entities.SesionResponse, error) {
	sesion, err := s.sesionRepo.FindAbiertaByUsuario(usuarioID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	return sesion.ToResponse(0, 0), nil
}

// ObtenerUltimaCerrada obtiene la última sesión cerrada del usuario
func (s *SesionService) ObtenerUltimaCerrada(usuarioID uuid.UUID) (*entities.SesionResponse, error) {
	sesion, err := s.sesionRepo.FindLastClosedByUsuario(usuarioID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	return sesion.ToResponse(0, 0), nil
}

// CerrarSesion cierra una sesión diaria
func (s *SesionService) CerrarSesion(input CerrarSesionInput) (*entities.SesionResponse, error) {
	sesion, err := s.sesionRepo.FindByID(input.SesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != input.UsuarioID {
		return nil, ErrUnauthorized
	}

	if sesion.Estado == entities.SesionCerrada {
		return nil, ErrSesionCerrada
	}

	// Obtener totales de movimientos
	movimientos, _ := s.movimientoRepo.FindBySesion(input.SesionID)
	var totalProveedor, totalGasto float64
	for _, m := range movimientos {
		if m.Categoria == entities.CategoriaProveedor {
			totalProveedor += m.Monto
		} else {
			totalGasto += m.Monto
		}
	}

	// Calcular refuerzos
	refuerzos, _ := s.refuerzoRepo.SumBySesion(input.SesionID)
	sesion.Refuerzos = refuerzos

	// Actualizar sesión
	now := time.Now()
	sesion.EfectivoFinal = input.EfectivoFinal
	sesion.BaseSiguiente = input.BaseSiguiente
	sesion.Estado = entities.SesionCerrada
	sesion.ClosedAt = &now

	err = s.sesionRepo.Update(sesion)
	if err != nil {
		return nil, err
	}

	// Retornar con cálculos
	resp := sesion.ToResponse(totalProveedor, totalGasto)
	return resp, nil
}

// ObtenerDetalleSesion obtiene una sesión con todos sus movimientos y refuerzos
func (s *SesionService) ObtenerDetalleSesion(sesionID, usuarioID uuid.UUID) (*entities.SesionDiaria, error) {
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return nil, ErrUnauthorized
	}

	// Cargar movimientos y refuerzos
	movimientos, _ := s.movimientoRepo.FindBySesion(sesionID)
	refuerzos, _ := s.refuerzoRepo.FindBySesion(sesionID)

	sesion.Movimientos = movimientos
	sesion.RefuerzosList = refuerzos

	// Calcular refuerzos acumulados
	sesion.Refuerzos = 0
	for _, r := range refuerzos {
		sesion.Refuerzos += r.Monto
	}

	return sesion, nil
}

type ModificarSesionInput struct {
	UsuarioID     uuid.UUID
	SesionID      uuid.UUID
	EfectivoFinal float64
	BaseSiguiente float64
}

// ModificarSesionCerrada modifica una sesión cerrada (máx 3 veces)
func (s *SesionService) ModificarSesionCerrada(input ModificarSesionInput) (*entities.SesionResponse, error) {
	sesion, err := s.sesionRepo.FindByID(input.SesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != input.UsuarioID {
		return nil, ErrUnauthorized
	}

	if sesion.Estado != entities.SesionCerrada {
		return nil, ErrSesionNoCerrada
	}

	if sesion.Modificaciones >= 3 {
		return nil, ErrMaxModificaciones
	}

	// Actualizar valores
	sesion.EfectivoFinal = input.EfectivoFinal
	sesion.BaseSiguiente = input.BaseSiguiente
	sesion.Modificaciones++

	err = s.sesionRepo.Update(sesion)
	if err != nil {
		return nil, err
	}

	// Obtener movimientos para calcular ventas
	movimientos, _ := s.movimientoRepo.FindBySesion(input.SesionID)
	var totalProveedor, totalGasto float64
	for _, m := range movimientos {
		if m.Categoria == entities.CategoriaProveedor {
			totalProveedor += m.Monto
		} else {
			totalGasto += m.Monto
		}
	}

	return sesion.ToResponse(totalProveedor, totalGasto), nil
}

// EliminarSesionCerrada elimina una sesión cerrada (solo si no tiene movimientos)
func (s *SesionService) EliminarSesionCerrada(sesionID, usuarioID uuid.UUID) error {
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return ErrUnauthorized
	}

	if sesion.Estado != entities.SesionCerrada {
		return ErrSesionNoCerrada
	}

	// Verificar que no tenga movimientos
	movimientos, _ := s.movimientoRepo.FindBySesion(sesionID)
	if len(movimientos) > 0 {
		return ErrSesionConMovimientos
	}

	return s.sesionRepo.Delete(sesionID)
}

// ReporteSesion representa una sesión en el reporte
type ReporteSesion struct {
	Fecha         string  `json:"fecha"`
	BaseInicial   float64 `json:"base_inicial"`
	Refuerzos     float64 `json:"refuerzos"`
	EfectivoFinal float64 `json:"efectivo_final"`
	Proveedores   float64 `json:"proveedores"`
	Gastos        float64 `json:"gastos"`
	Ventas        float64 `json:"ventas"`
}

// ReporteResumen representa el resumen de un período
type ReporteResumen struct {
	Periodo          string          `json:"periodo"`
	TotalDias        int             `json:"total_dias"`
	TotalBase        float64         `json:"total_base"`
	TotalRefuerzos   float64         `json:"total_refuerzos"`
	TotalProveedores float64         `json:"total_proveedores"`
	TotalGastos      float64         `json:"total_gastos"`
	TotalVentas      float64         `json:"total_ventas"`
	Sesiones         []ReporteSesion `json:"sesiones"`
}

// ObtenerReporteSemanal obtiene el reporte de la semana actual
func (s *SesionService) ObtenerReporteSemanal(usuarioID uuid.UUID, timezone string) (*ReporteResumen, error) {
	loc := getLocation(timezone)
	now := time.Now().In(loc)

	// Calcular inicio de semana (lunes)
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	lunes := now.AddDate(0, 0, -(weekday - 1))
	inicioSemana := time.Date(lunes.Year(), lunes.Month(), lunes.Day(), 0, 0, 0, 0, loc)

	finSemana := inicioSemana.AddDate(0, 0, 7)

	return s.generarReporte(usuarioID, inicioSemana, finSemana, "Semana actual", timezone)
}

// ObtenerReporteMensual obtiene el reporte del mes actual
func (s *SesionService) ObtenerReporteMensual(usuarioID uuid.UUID, timezone string) (*ReporteResumen, error) {
	loc := getLocation(timezone)
	now := time.Now().In(loc)

	// Primer día del mes
	inicioMes := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	// Primer día del siguiente mes
	finMes := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, loc)

	meses := []string{"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"}
	periodo := fmt.Sprintf("%s %d", meses[now.Month()-1], now.Year())

	return s.generarReporte(usuarioID, inicioMes, finMes, periodo, timezone)
}

// ObtenerReporteMensualPorMes obtiene el reporte de un mes específico
func (s *SesionService) ObtenerReporteMensualPorMes(usuarioID uuid.UUID, year, month int, timezone string) (*ReporteResumen, error) {
	loc := getLocation(timezone)

	// Primer día del mes especificado
	inicioMes := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
	// Primer día del siguiente mes
	finMes := time.Date(year, time.Month(month)+1, 1, 0, 0, 0, 0, loc)

	meses := []string{"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"}
	periodo := fmt.Sprintf("%s %d", meses[month-1], year)

	return s.generarReporte(usuarioID, inicioMes, finMes, periodo, timezone)
}

// generarReporte genera un reporte para un rango de fechas
func (s *SesionService) generarReporte(usuarioID uuid.UUID, inicio, fin time.Time, periodo, timezone string) (*ReporteResumen, error) {
	sesiones, err := s.sesionRepo.FindByUsuario(usuarioID)
	if err != nil {
		return nil, err
	}

	reporte := &ReporteResumen{
		Periodo:  periodo,
		Sesiones: []ReporteSesion{},
	}

	// Usar la timezone del usuario para las comparaciones
	loc := getLocation(timezone)
	inicioDia := time.Date(inicio.Year(), inicio.Month(), inicio.Day(), 0, 0, 0, 0, loc)
	finDia := time.Date(fin.Year(), fin.Month(), fin.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, -1)

	for _, sesion := range sesiones {
		// Solo sesiones cerradas dentro del período
		if sesion.Estado != entities.SesionCerrada {
			continue
		}

		// Comparar fechas usando la timezone del usuario
		sesionYear, sesionMonth, sesionDay := sesion.Fecha.In(loc).Date()
		inicioYear, inicioMonth, inicioDay := inicioDia.Date()
		finYear, finMonth, finDay := finDia.Date()

		sesionDate := sesionYear*10000 + int(sesionMonth)*100 + sesionDay
		inicioDate := inicioYear*10000 + int(inicioMonth)*100 + inicioDay
		finDate := finYear*10000 + int(finMonth)*100 + finDay

		if sesionDate < inicioDate || sesionDate > finDate {
			continue
		}

		// Obtener movimientos para calcular proveedores y gastos
		movimientos, _ := s.movimientoRepo.FindBySesion(sesion.ID)
		var totalProveedor, totalGasto float64
		for _, m := range movimientos {
			if m.Categoria == entities.CategoriaProveedor {
				totalProveedor += m.Monto
			} else {
				totalGasto += m.Monto
			}
		}

		// Calcular ventas
		ventas := (totalProveedor + totalGasto + sesion.EfectivoFinal) - (sesion.BaseInicial + sesion.Refuerzos)

		reporteSesion := ReporteSesion{
			Fecha:         sesion.Fecha.Format("2006-01-02"),
			BaseInicial:   sesion.BaseInicial,
			Refuerzos:     sesion.Refuerzos,
			EfectivoFinal: sesion.EfectivoFinal,
			Proveedores:   totalProveedor,
			Gastos:        totalGasto,
			Ventas:        ventas,
		}

		reporte.Sesiones = append(reporte.Sesiones, reporteSesion)

		// Acumular totales
		reporte.TotalDias++
		reporte.TotalBase += sesion.BaseInicial
		reporte.TotalRefuerzos += sesion.Refuerzos
		reporte.TotalProveedores += totalProveedor
		reporte.TotalGastos += totalGasto
		reporte.TotalVentas += ventas
	}

	return reporte, nil
}
