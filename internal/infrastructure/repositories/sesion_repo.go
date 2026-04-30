package repositories

import (
	"time"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SesionRepository struct {
	db *gorm.DB
}

func NewSesionRepository(db *gorm.DB) ports.SesionRepository {
	return &SesionRepository{db: db}
}

func (r *SesionRepository) Create(sesion *entities.SesionDiaria) error {
	return r.db.Create(sesion).Error
}

func (r *SesionRepository) FindByID(id uuid.UUID) (*entities.SesionDiaria, error) {
	var sesion entities.SesionDiaria
	err := r.db.Preload("Movimientos").Preload("RefuerzosList").Where("id = ?", id).First(&sesion).Error
	if err != nil {
		return nil, err
	}
	return &sesion, nil
}

func (r *SesionRepository) FindByUsuarioAndFecha(usuarioID uuid.UUID, fecha time.Time) (*entities.SesionDiaria, error) {
	var sesion entities.SesionDiaria
	// Truncate to date for comparison
	fecha = time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	err := r.db.Where("usuario_id = ? AND DATE(fecha) = ?", usuarioID, fecha).First(&sesion).Error
	if err != nil {
		return nil, err
	}
	return &sesion, nil
}

func (r *SesionRepository) FindByUsuario(usuarioID uuid.UUID) ([]entities.SesionDiaria, error) {
	var sesiones []entities.SesionDiaria
	err := r.db.Where("usuario_id = ?", usuarioID).Order("fecha DESC").Find(&sesiones).Error
	return sesiones, err
}

func (r *SesionRepository) FindAbiertaByUsuario(usuarioID uuid.UUID) (*entities.SesionDiaria, error) {
	var sesion entities.SesionDiaria
	err := r.db.Where("usuario_id = ? AND estado = ?", usuarioID, entities.SesionAbierta).First(&sesion).Error
	if err != nil {
		return nil, err
	}
	return &sesion, nil
}

func (r *SesionRepository) Update(sesion *entities.SesionDiaria) error {
	return r.db.Save(sesion).Error
}

func (r *SesionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&entities.SesionDiaria{}, "id = ?", id).Error
}