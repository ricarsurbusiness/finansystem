package services

import (
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
)

type RefuerzoService struct {
	refuerzoRepo ports.RefuerzoRepository
	sesionRepo    ports.SesionRepository
}

func NewRefuerzoService(
	refuerzoRepo ports.RefuerzoRepository,
	sesionRepo ports.SesionRepository,
) *RefuerzoService {
	return &RefuerzoService{
		refuerzoRepo: refuerzoRepo,
		sesionRepo:    sesionRepo,
	}
}

type CrearRefuerzoInput struct {
	SesionID    uuid.UUID
	UsuarioID   uuid.UUID
	Monto       float64
	Observacion *string
}

// CrearRefuerzo crea un nuevo refuerzo
func (s *RefuerzoService) CrearRefuerzo(input CrearRefuerzoInput) (*entities.RefuerzoResponse, error) {
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

	refuerzo := &entities.Refuerzo{
		SesionID:   input.SesionID,
		Monto:      input.Monto,
		Observacion: input.Observacion,
		Hora:       time.Now(),
	}

	err = s.refuerzoRepo.Create(refuerzo)
	if err != nil {
		return nil, err
	}

	return refuerzo.ToResponse(), nil
}

// ObtenerRefuerzosBySesion obtiene todos los refuerzos de una sesión
func (s *RefuerzoService) ObtenerRefuerzosBySesion(sesionID, usuarioID uuid.UUID) ([]entities.RefuerzoResponse, error) {
	// Verificar sesión
	sesion, err := s.sesionRepo.FindByID(sesionID)
	if err != nil {
		return nil, ErrSesionNotFound
	}

	if sesion.UsuarioID != usuarioID {
		return nil, ErrUnauthorized
	}

	refuerzos, err := s.refuerzoRepo.FindBySesion(sesionID)
	if err != nil {
		return nil, err
	}

	resp := make([]entities.RefuerzoResponse, len(refuerzos))
	for i, r := range refuerzos {
		resp[i] = *r.ToResponse()
	}

	return resp, nil
}