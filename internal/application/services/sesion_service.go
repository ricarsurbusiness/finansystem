package services

import (
	"errors"
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
)

var (
	ErrSesionNotFound = errors.New("sesión no encontrada")
	ErrSesionCerrada  = errors.New("la sesión ya está cerrada")
	ErrSesionAbierta  = errors.New("ya existe una sesión abierta para hoy")
	ErrUnauthorized   = errors.New("no autorizado")
)

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
	fecha := time.Now()
	if input.Fecha != nil {
		fecha = *input.Fecha
	}

	// Normalizar fecha
	fecha = time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, time.UTC)

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
		resp[i] = *sesion.ToResponse(0, 0)
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
