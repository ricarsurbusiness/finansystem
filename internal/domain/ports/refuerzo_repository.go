package ports

import (
	"github.com/finansystem/internal/domain/entities"
	"github.com/google/uuid"
)

type RefuerzoRepository interface {
	Create(refuerzo *entities.Refuerzo) error
	FindByID(id uuid.UUID) (*entities.Refuerzo, error)
	FindBySesion(sesionID uuid.UUID) ([]entities.Refuerzo, error)
	SumBySesion(sesionID uuid.UUID) (float64, error)
	Update(refuerzo *entities.Refuerzo) error
	Delete(id uuid.UUID) error
}