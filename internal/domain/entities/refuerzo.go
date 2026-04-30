package entities

import (
	"time"

	"github.com/google/uuid"
)

type Refuerzo struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SesionID   uuid.UUID  `json:"sesion_id" gorm:"type:uuid;not null"`
	Monto      float64    `json:"monto" gorm:"type:numeric(12,2);not null"`
	Observacion *string   `json:"observacion,omitempty" gorm:"type:varchar(255)"`
	Hora       time.Time  `json:"hora" gorm:"not null"`
	CreatedAt  time.Time  `json:"created_at" gorm:"autoCreateTime"`
	Sesion     SesionDiaria `json:"sesion,omitempty" gorm:"foreignKey:SesionID;references:ID"`
}

func (Refuerzo) TableName() string {
	return "refuerzos"
}

// RefuerzoResponse es la respuesta que enviamos al frontend
type RefuerzoResponse struct {
	ID          uuid.UUID  `json:"id"`
	SesionID    uuid.UUID  `json:"sesion_id"`
	Monto       float64    `json:"monto"`
	Observacion *string    `json:"observacion,omitempty"`
	Hora        time.Time  `json:"hora"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ToResponse convierte Refuerzo a RefuerzoResponse
func (r *Refuerzo) ToResponse() *RefuerzoResponse {
	return &RefuerzoResponse{
		ID:          r.ID,
		SesionID:    r.SesionID,
		Monto:       r.Monto,
		Observacion: r.Observacion,
		Hora:        r.Hora,
		CreatedAt:   r.CreatedAt,
	}
}