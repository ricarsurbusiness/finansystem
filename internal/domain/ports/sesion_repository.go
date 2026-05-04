package ports

import (
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/google/uuid"
)

type SesionRepository interface {
	Create(sesion *entities.SesionDiaria) error
	FindByID(id uuid.UUID) (*entities.SesionDiaria, error)
	FindByUsuarioAndFecha(usuarioID uuid.UUID, fecha time.Time) (*entities.SesionDiaria, error)
	FindByUsuario(usuarioID uuid.UUID) ([]entities.SesionDiaria, error)
	FindAbiertaByUsuario(usuarioID uuid.UUID) (*entities.SesionDiaria, error)
	FindLastClosedByUsuario(usuarioID uuid.UUID) (*entities.SesionDiaria, error)
	Update(sesion *entities.SesionDiaria) error
	Delete(id uuid.UUID) error
}
