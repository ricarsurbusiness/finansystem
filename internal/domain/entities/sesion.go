package entities

import (
	"time"

	"github.com/google/uuid"
)

type SesionEstado string

const (
	SesionAbierta  SesionEstado = "abierta"
	SesionCerrada  SesionEstado = "cerrada"
)

type SesionDiaria struct {
	ID             uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UsuarioID      uuid.UUID     `json:"usuario_id" gorm:"type:uuid;not null"`
	Fecha          time.Time     `json:"fecha" gorm:"type:date;not null"`
	BaseInicial    float64       `json:"base_inicial" gorm:"type:numeric(12,2);not null"`
	Refuerzos      float64       `json:"refuerzos" gorm:"type:numeric(12,2);default:0"`
	EfectivoFinal  float64       `json:"efectivo_final" gorm:"type:numeric(12,2);default:0"`
	BaseSiguiente  float64       `json:"base_siguiente" gorm:"type:numeric(12,2);default:0"`
	Estado         SesionEstado  `json:"estado" gorm:"type:varchar(20);default:'abierta'"`
	CreatedAt      time.Time     `json:"created_at" gorm:"autoCreateTime"`
	ClosedAt       *time.Time   `json:"closed_at" gorm:"nullable"`
	Usuario        User          `json:"usuario,omitempty" gorm:"foreignKey:UsuarioID;references:ID"`
	Movimientos    []Movimiento  `json:"movimientos,omitempty" gorm:"foreignKey:SesionID;references:ID"`
	RefuerzosList  []Refuerzo    `json:"refuerzos_list,omitempty" gorm:"foreignKey:SesionID;references:ID"`
}

func (SesionDiaria) TableName() string {
	return "sesiones"
}

// CalcularTotal calcula el total del día: (Base + Refuerzos + EfectivoFinal) - Compras
func (s *SesionDiaria) CalcularTotal(compras float64, gastos float64) float64 {
	return (s.BaseInicial + s.Refuerzos + s.EfectivoFinal) - compras - gastos
}

// CalcularVentas calcula las ventas implícitas del día
func (s *SesionDiaria) CalcularVentas(compras float64, gastos float64) float64 {
	// Ventas = (Compras + Gastos + EfectivoFinal) - (BaseInicial + Refuerzos)
	return (compras + gastos + s.EfectivoFinal) - (s.BaseInicial + s.Refuerzos)
}

// SesionResponse es la respuesta que enviamos al frontend
type SesionResponse struct {
	ID             uuid.UUID    `json:"id"`
	UsuarioID      uuid.UUID    `json:"usuario_id"`
	Fecha          string       `json:"fecha"`
	BaseInicial    float64      `json:"base_inicial"`
	Refuerzos      float64      `json:"refuerzos"`
	EfectivoFinal  float64      `json:"efectivo_final"`
	BaseSiguiente  float64      `json:"base_siguiente"`
	Estado         string       `json:"estado"`
	CreatedAt      time.Time    `json:"created_at"`
	ClosedAt       *time.Time   `json:"closed_at,omitempty"`
}

// ToResponse convierte SesionDiaria a SesionResponse
func (s *SesionDiaria) ToResponse() *SesionResponse {
	return &SesionResponse{
		ID:            s.ID,
		UsuarioID:     s.UsuarioID,
		Fecha:         s.Fecha.Format("2006-01-02"),
		BaseInicial:   s.BaseInicial,
		Refuerzos:     s.Refuerzos,
		EfectivoFinal: s.EfectivoFinal,
		BaseSiguiente: s.BaseSiguiente,
		Estado:        string(s.Estado),
		CreatedAt:     s.CreatedAt,
		ClosedAt:      s.ClosedAt,
	}
}