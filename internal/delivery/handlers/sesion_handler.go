package handlers

import (
	"net/http"

	"github.com/finansystem/internal/application/services"
	"github.com/finansystem/internal/delivery/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SesionHandler struct {
	sesionService *services.SesionService
}

func NewSesionHandler(sesionService *services.SesionService) *SesionHandler {
	return &SesionHandler{sesionService: sesionService}
}

type CrearSesionRequest struct {
	BaseInicial float64 `json:"base_inicial" binding:"required,min=0"`
}

type CerrarSesionRequest struct {
	EfectivoFinal float64 `json:"efectivo_final" binding:"required,min=0"`
	BaseSiguiente float64 `json:"base_siguiente" binding:"required,min=0"`
}

// Crear maneja la creación de una nueva sesión
func (h *SesionHandler) Crear(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	var req CrearSesionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	sesion, err := h.sesionService.CrearSesion(services.CrearSesionInput{
		UsuarioID:   userID,
		BaseInicial: req.BaseInicial,
	})

	if err != nil {
		if err == services.ErrSesionAbierta {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ya existe una sesión abierta para hoy"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al crear sesión"})
		return
	}

	c.JSON(http.StatusCreated, sesion)
}

// Obtener maneja la obtención de una sesión por ID
func (h *SesionHandler) Obtener(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Param("id")
	sesionID, err := uuid.Parse(sesionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	sesion, err := h.sesionService.ObtenerSesion(sesionID, userID)
	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener sesión"})
		return
	}

	c.JSON(http.StatusOK, sesion)
}

// ObtenerTodas maneja la obtención de todas las sesiones del usuario
func (h *SesionHandler) ObtenerTodas(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	sesiones, err := h.sesionService.ObtenerSesiones(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener sesiones"})
		return
	}

	c.JSON(http.StatusOK, sesiones)
}

// ObtenerAbierta maneja la obtención de la sesión abierta actual
func (h *SesionHandler) ObtenerAbierta(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)

	sesion, err := h.sesionService.ObtenerSesionAbierta(userID)
	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "no hay sesión abierta"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener sesión"})
		return
	}

	c.JSON(http.StatusOK, sesion)
}

// Cerrar maneja el cierre de una sesión
func (h *SesionHandler) Cerrar(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Param("id")
	sesionID, err := uuid.Parse(sesionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	var req CerrarSesionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	sesion, err := h.sesionService.CerrarSesion(services.CerrarSesionInput{
		UsuarioID:      userID,
		SesionID:       sesionID,
		EfectivoFinal:  req.EfectivoFinal,
		BaseSiguiente:  req.BaseSiguiente,
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
		if err == services.ErrSesionCerrada {
			c.JSON(http.StatusBadRequest, gin.H{"error": "la sesión ya está cerrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al cerrar sesión"})
		return
	}

	c.JSON(http.StatusOK, sesion)
}

// ObtenerDetalle maneja la obtención de una sesión con todos sus detalles
func (h *SesionHandler) ObtenerDetalle(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	sesionIDStr := c.Param("id")
	sesionID, err := uuid.Parse(sesionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de sesión inválido"})
		return
	}

	sesion, err := h.sesionService.ObtenerDetalleSesion(sesionID, userID)
	if err != nil {
		if err == services.ErrSesionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "sesión no encontrada"})
			return
		}
		if err == services.ErrUnauthorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "no autorizado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al obtener detalle"})
		return
	}

	c.JSON(http.StatusOK, sesion)
}