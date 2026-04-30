package handlers

import (
	"net/http"

	"github.com/finansystem/internal/application/services"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nombre   string `json:"nombre" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register maneja el registro de usuarios
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	user, err := h.authService.Register(services.RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		Nombre:   req.Nombre,
	})

	if err != nil {
		if err == services.ErrUserAlreadyExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email ya registrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al registrar usuario"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":    user,
		"message": "usuario registrado exitosamente",
	})
}

// Login maneja el login de usuarios
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}

	resp, err := h.authService.Login(services.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		if err == services.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al iniciar sesión"})
		return
	}

	// Establecer refresh token como cookie httpOnly
	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*60*60, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": resp.AccessToken,
		"user":         resp.User,
	})
}

// Refresh maneja el refresh de tokens
func (h *AuthHandler) Refresh(c *gin.Context) {
	// El middleware ya maneja el refresh, aquí solo necesitamos generar un nuevo access token
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token no encontrado"})
		return
	}

	accessToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token inválido"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

// Logout maneja el logout
func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "sesión cerrada"})
}

// GetMe obtiene el usuario actual
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autorizado"})
		return
	}

	// Parsear UUID
	// Por ahora usamos un enfoque simple
	// En producción debería usar uuid.Parse
	user, err := h.authService.GetUserByIDStr(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}