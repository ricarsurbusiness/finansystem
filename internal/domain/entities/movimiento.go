package entities

import (
	"time"

	"github.com/google/uuid"
)

type Categoria string

const (
	CategoriaProveedor Categoria = "proveedor"
	CategoriaGasto     Categoria = "gasto"
)

type Movimiento struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SesionID     uuid.UUID  `json:"sesion_id" gorm:"type:uuid;not null"`
	Detalle      string     `json:"detalle" gorm:"not null"`
	Monto        float64    `json:"monto" gorm:"type:numeric(12,2);not null"`
	Categoria    Categoria  `json:"categoria" gorm:"type:varchar(20);not null"`
	Subcategoria *string    `json:"subcategoria,omitempty" gorm:"type:varchar(100)"`
	Hora         time.Time  `json:"hora" gorm:"not null"`
	CreatedAt    time.Time  `json:"created_at" gorm:"autoCreateTime"`
	Sesion       SesionDiaria `json:"sesion,omitempty" gorm:"foreignKey:SesionID;references:ID"`
}

func (Movimiento) TableName() string {
	return "movimientos"
}

// MovimientoResponse es la respuesta que enviamos al frontend
type MovimientoResponse struct {
	ID           uuid.UUID  `json:"id"`
	SesionID     uuid.UUID  `json:"sesion_id"`
	Detalle      string     `json:"detalle"`
	Monto        float64    `json:"monto"`
	Categoria    string     `json:"categoria"`
	Subcategoria *string   `json:"subcategoria,omitempty"`
	Hora         time.Time  `json:"hora"`
	CreatedAt    time.Time  `json:"created_at"`
}

// ToResponse convierte Movimiento a MovimientoResponse
func (m *Movimiento) ToResponse() *MovimientoResponse {
	return &MovimientoResponse{
		ID:           m.ID,
		SesionID:     m.SesionID,
		Detalle:      m.Detalle,
		Monto:        m.Monto,
		Categoria:    string(m.Categoria),
		Subcategoria: m.Subcategoria,
		Hora:         m.Hora,
		CreatedAt:    m.CreatedAt,
	}
}