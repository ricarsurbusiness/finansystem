package handlers

import (
	"net/http"

	"github.com/finansystem/internal/application/services"
	"github.com/finansystem/internal/delivery/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UpdateHandler struct {
	movimientoService *services.MovimientoService
	refuerzoService   *services.RefuerzoService
}

func NewUpdateHandler(movimientoService *services.MovimientoService, refuerzoService *services.RefuerzoService) *UpdateHandler {
	return &UpdateHandler{
		movimientoService: movimientoService,
		refuerzoService:   refuerzoService,
	}
}

type UpdateMovimientoRequest struct {
	Detalle      string  `json:"detalle"`
	Monto        float64 `json:"monto"`
	Categoria    string  `json:"categoria"`
	Subcategoria *string `json:"subcategoria"`
}

// ActualizarMovimiento actualiza un movimiento
func (h *UpdateHandler) ActualizarMovimiento(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	movimientoIDStr := c.Param("id")
	movimientoID, err := uuid.Parse(movimientoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de movimiento inválido"})
		return
	}

	var req UpdateMovimientoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	// Obtener sesion_id del query o del movimiento
	sesionIDStr := c.Query("sesion_id")
	if sesionIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "se requiere sesion_id"})
		return
	}
	sesionID, _ := uuid.Parse(sesionIDStr)

	err = h.movimientoService.ActualizarMovimiento(movimientoID, sesionID, userID, req.Detalle, req.Monto, req.Categoria, req.Subcategoria)
	if err != nil {
		if err.Error() == "movimiento no encontrado" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "sesión no encontrada" || err.Error() == "no autorizado" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "movimiento actualizado"})
}

type UpdateRefuerzoRequest struct {
	Monto       float64 `json:"monto"`
	Observacion string  `json:"observacion"`
}

// ActualizarRefuerzo actualiza un refuerzo
func (h *UpdateHandler) ActualizarRefuerzo(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	refuerzoIDStr := c.Param("id")
	refuerzoID, err := uuid.Parse(refuerzoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de refuerzo inválido"})
		return
	}

	var req UpdateRefuerzoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	// Obtener sesion_id del query
	sesionIDStr := c.Query("sesion_id")
	if sesionIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "se requiere sesion_id"})
		return
	}
	sesionID, _ := uuid.Parse(sesionIDStr)

	err = h.refuerzoService.ActualizarRefuerzo(refuerzoID, sesionID, userID, req.Monto, req.Observacion)
	if err != nil {
		if err.Error() == "refuerzo no encontrado" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "sesión no encontrada" || err.Error() == "no autorizado" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "refuerzo actualizado"})
}
