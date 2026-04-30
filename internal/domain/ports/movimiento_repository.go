package ports

import (
	"github.com/finansystem/internal/domain/entities"
	"github.com/google/uuid"
)

type MovimientoRepository interface {
	Create(movimiento *entities.Movimiento) error
	FindByID(id uuid.UUID) (*entities.Movimiento, error)
	FindBySesion(sesionID uuid.UUID) ([]entities.Movimiento, error)
	FindBySesionAndCategoria(sesionID uuid.UUID, categoria entities.Categoria) ([]entities.Movimiento, error)
	Update(movimiento *entities.Movimiento) error
	Delete(id uuid.UUID) error
}