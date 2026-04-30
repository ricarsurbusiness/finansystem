package repositories

import (
	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MovimientoRepository struct {
	db *gorm.DB
}

func NewMovimientoRepository(db *gorm.DB) ports.MovimientoRepository {
	return &MovimientoRepository{db: db}
}

func (r *MovimientoRepository) Create(movimiento *entities.Movimiento) error {
	return r.db.Create(movimiento).Error
}

func (r *MovimientoRepository) FindByID(id uuid.UUID) (*entities.Movimiento, error) {
	var movimiento entities.Movimiento
	err := r.db.Where("id = ?", id).First(&movimiento).Error
	if err != nil {
		return nil, err
	}
	return &movimiento, nil
}

func (r *MovimientoRepository) FindBySesion(sesionID uuid.UUID) ([]entities.Movimiento, error) {
	var movimientos []entities.Movimiento
	err := r.db.Where("sesion_id = ?", sesionID).Order("hora DESC").Find(&movimientos).Error
	return movimientos, err
}

func (r *MovimientoRepository) FindBySesionAndCategoria(sesionID uuid.UUID, categoria entities.Categoria) ([]entities.Movimiento, error) {
	var movimientos []entities.Movimiento
	err := r.db.Where("sesion_id = ? AND categoria = ?", sesionID, categoria).Order("hora DESC").Find(&movimientos).Error
	return movimientos, err
}

func (r *MovimientoRepository) Update(movimiento *entities.Movimiento) error {
	return r.db.Save(movimiento).Error
}

func (r *MovimientoRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entities.Movimiento{}, "id = ?", id).Error
}