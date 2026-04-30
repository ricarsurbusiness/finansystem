package services

import (
	"errors"
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
)

var (
	ErrMovimientoNotFound = errors.New("movimiento no encontrado")
	ErrSesionNoAbierta    = errors.New("la sesión no está abierta")
)

type MovimientoService struct {
	movimientoRepo ports.MovimientoRepository
	sesionRepo     ports.SesionRepository
}

func NewMovimientoService(
	movimientoRepo ports.MovimientoRepository,
	sesionRepo ports.SesionRepository,
) *MovimientoService {
	return &MovimientoService{
		movimientoRepo: movimientoRepo,
		sesionRepo:     sesionRepo,
	}
}

type CrearMovimientoInput struct {
	SesionID     uuid.UUID
	UsuarioID    uuid.UUID
	Detalle      string
	Monto        float64
	Categoria    entities.Categoria
	Subcategoria *string
}

// CrearMovimiento crea un nuevo movimiento
func (s *MovimientoService) CrearMovimiento(input CrearMovimientoInput) (*entities.MovimientoResponse, error) {
	// Verificar que la sesión existe y está abierta
	sesion, err := s.sesionRepo.FindByID(input.SesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != input.UsuarioID {
		return nil, ErrUnauthorized
	}

	if sesion.Estado != entities.SesionAbierta {
		return nil, ErrSesionNoAbierta
	}

	movimiento := &entities.Movimiento{
		SesionID:     input.SesionID,
		Detalle:      input.Detalle,
		Monto:        input.Monto,
		Categoria:    input.Categoria,
		Subcategoria: input.Subcategoria,
		Hora:         time.Now(),
	}

	err = s.movimientoRepo.Create(movimiento)
	if err != nil {
		return nil, err
	}

	return movimiento.ToResponse(), nil
}

// ObtenerMovimientosBySesion obtiene todos los movimientos de una sesión
func (s *MovimientoService) ObtenerMovimientosBySesion(sesionID, usuarioID uuid.UUID) ([]entities.MovimientoResponse, error) {
	// Verificar sesión
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return nil, ErrUnauthorized
	}

	movimientos, err := s.movimientoRepo.FindBySesion(sesionID)
	if err != nil {
		return nil, err
	}

	resp := make([]entities.MovimientoResponse, len(movimientos))
	for i, m := range movimientos {
		resp[i] = *m.ToResponse()
	}

	return resp, nil
}

// EliminarMovimiento elimina un movimiento
func (s *MovimientoService) EliminarMovimiento(movimientoID, sesionID, usuarioID uuid.UUID) error {
	// Verificar sesión
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return ErrUnauthorized
	}

	if sesion.Estado != entities.SesionAbierta {
		return ErrSesionNoAbierta
	}

	// Verificar movimiento
	movimiento, err := s.movimientoRepo.FindByID(movimientoID)
	if err != nil {
		return ErrMovimientoNotFound
	}

	if movimiento.SesionID != sesionID {
		return ErrMovimientoNotFound
	}

	return s.movimientoRepo.Delete(movimientoID)
}