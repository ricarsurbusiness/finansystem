package handlers

import (
	"net/http"

	"github.com/finansystem/internal/application/services"
	"github.com/finansystem/internal/delivery/middleware"
	"github.com/finansystem/internal/domain/entities"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MovimientoHandler struct {
	movimientoService *services.MovimientoService
}

func NewMovimientoHandler(movimientoService *services.MovimientoService) *MovimientoHandler {
	return &MovimientoHandler{movimientoService: movimientoService}
}

type CrearMovimientoRequest struct {
	SesionID     string  `json:"sesion_id" binding:"required"`
	Detalle      string  `json:"detalle" binding:"required"`
	Monto        float64 `json:"monto" binding:"required,min=0"`
	Categoria    string  `json:"categoria" binding:"required,oneof=proveedor gasto"`
	Subcategoria string  `json:"subcategoria"`
}

// Crear maneja la creación de un nuevo movimiento
func (h *MovimientoHandler) Crear(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	var req CrearMovimientoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	sesionID, err := uuid.Parse(req.SesionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	var subcategoria *string
	if req.Subcategoria != "" {
		subcategoria = &req.Subcategoria
	}

	categoria := entities.Categoria(req.Categoria)

	movimiento, err := h.movimientoService.CrearMovimiento(services.CrearMovimientoInput{
		SesionID:     sesionID,
		UsuarioID:    userID,
		Detalle:      req.Detalle,
		Monto:        req.Monto,
		Categoria:    categoria,
		Subcategoria: subcategoria,
	})

	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		if err == services.ErrSesionNoAbierta {
			c.JSON(http.StatusBadRequest, gin.H{"error": "la sesión no está abierta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear movimiento"})
		return
	}

	c.JSON(http.StatusCreated, movimiento)
}

// ObtenerPorSesion maneja la obtención de movimientos de una sesión
func (h *MovimientoHandler) ObtenerPorSesion(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Query("sesion_id")
	sesionID, err := uuid.Parse(sesionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	movimientos, err := h.movimientoService.ObtenerMovimientosBySesion(sesionID, userID)
	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener movimientos"})
		return
	}

	c.JSON(http.StatusOK, movimientos)
}

// Eliminar maneja la eliminación de un movimiento
func (h *MovimientoHandler) Eliminar(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Query("sesion_id")
	if sesionIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "se requiere sesión_id"})
		return
	}

	sesionID, _ := uuid.Parse(sesionIDStr)
	movimientoIDStr := c.Param("id")
	movimientoID, err := uuid.Parse(movimientoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de movimiento inválido"})
		return
	}

	err = h.movimientoService.EliminarMovimiento(movimientoID, sesionID, userID)
	if err != nil {
		if err == services.ErrMovimientoNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "movimiento no encontrado"})
			return
		}
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		if err == services.ErrSesionNoAbierta {
			c.JSON(http.StatusBadRequest, gin.H{"error": "la sesión no está abierta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al eliminar movimiento"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "movimiento eliminado"})
}
