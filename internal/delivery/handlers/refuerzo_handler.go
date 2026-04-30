package handlers

import (
	"net/http"

	"github.com/finansystem/internal/application/services"
	"github.com/finansystem/internal/delivery/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RefuerzoHandler struct {
	refuerzoService *services.RefuerzoService
}

func NewRefuerzoHandler(refuerzoService *services.RefuerzoService) *RefuerzoHandler {
	return &RefuerzoHandler{refuerzoService: refuerzoService}
}

type CrearRefuerzoRequest struct {
	SesionID    string  `json:"sesion_id" binding:"required"`
	Monto       float64 `json:"monto" binding:"required,min=0"`
	Observacion string  `json:"observacion"`
}

// Crear maneja la creación de un nuevo refuerzo
func (h *RefuerzoHandler) Crear(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	var req CrearRefuerzoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	sesionID, err := uuid.Parse(req.SesionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	var observacion *string
	if req.Observacion != "" {
		observacion = &req.Observacion
	}

	refuerzo, err := h.refuerzoService.CrearRefuerzo(services.CrearRefuerzoInput{
		SesionID:    sesionID,
		UsuarioID:   userID,
		Monto:       req.Monto,
		Observacion: observacion,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear refuerzo"})
		return
	}

	c.JSON(http.StatusCreated, refuerzo)
}

// ObtenerPorSesion maneja la obtención de refuerzos de una sesión
func (h *RefuerzoHandler) ObtenerPorSesion(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Param("sesion_id")
	sesionID, err := uuid.Parse(sesionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	refuerzos, err := h.refuerzoService.ObtenerRefuerzosBySesion(sesionID, userID)
	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener refuerzos"})
		return
	}

	c.JSON(http.StatusOK, refuerzos)
}