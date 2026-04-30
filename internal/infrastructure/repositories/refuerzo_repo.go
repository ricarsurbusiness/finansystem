package repositories

import (
	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RefuerzoRepository struct {
	db *gorm.DB
}

func NewRefuerzoRepository(db *gorm.DB) ports.RefuerzoRepository {
	return &RefuerzoRepository{db: db}
}

func (r *RefuerzoRepository) Create(refuerzo *entities.Refuerzo) error {
	return r.db.Create(refuerzo).Error
}

func (r *RefuerzoRepository) FindByID(id uuid.UUID) (*entities.Refuerzo, error) {
	var refuerzo entities.Refuerzo
	err := r.db.Where("id = ?", id).First(&refuerzo).Error
	if err != nil {
		return nil, err
	}
	return &refuerzo, nil
}

func (r *RefuerzoRepository) FindBySesion(sesionID uuid.UUID) ([]entities.Refuerzo, error) {
	var refuerzos []entities.Refuerzo
	err := r.db.Where("sesion_id = ?", sesionID).Order("hora DESC").Find(&refuerzos).Error
	return refuerzos, err
}

func (r *RefuerzoRepository) SumBySesion(sesionID uuid.UUID) (float64, error) {
	var total float64
	err := r.db.Model(&entities.Refuerzo{}).Where("sesion_id = ?", sesionID).Select("COALESCE(SUM(monto), 0)").Scan(&total).Error
	return total, err
}

func (r *RefuerzoRepository) Update(refuerzo *entities.Refuerzo) error {
	return r.db.Save(refuerzo).Error
}

func (r *RefuerzoRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entities.Refuerzo{}, "id = ?", id).Error
}