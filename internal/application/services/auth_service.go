package services

import (
	"errors"

	"github.com/finansystem/internal/domain/entities"
	"github.com/finansystem/internal/domain/ports"
	"github.com/finansystem/internal/infrastructure/security"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("credenciales inválidas")
	ErrUserAlreadyExists  = errors.New("el usuario ya existe")
	ErrUserNotFound       = errors.New("usuario no encontrado")
)

type AuthService struct {
	userRepo ports.UserRepository
	jwtMgr   *security.JWTManager
}

func NewAuthService(userRepo ports.UserRepository, jwtMgr *security.JWTManager) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		jwtMgr:   jwtMgr,
	}
}

type RegisterInput struct {
	Email    string
	Password string
	Nombre   string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthResponse struct {
	AccessToken  string
	RefreshToken string
	User         entities.UserResponse
}

// Register crea un nuevo usuario
func (s *AuthService) Register(input RegisterInput) (*entities.UserResponse, error) {
	// Verificar si el usuario ya existe
	existing, _ := s.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, ErrUserAlreadyExists
	}

	// Hash de la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Crear usuario
	user := &entities.User{
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Nombre:       input.Nombre,
	}

	err = s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	return user.ToResponse(), nil
}

// Login autentica a un usuario
func (s *AuthService) Login(input LoginInput) (*AuthResponse, error) {
	// Buscar usuario
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Verificar contraseña
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Generar tokens
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtMgr.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user.ToResponse(),
	}, nil
}

// RefreshToken genera un nuevo access token desde un refresh token
func (s *AuthService) RefreshToken(refreshToken string) (string, error) {
	claims, err := s.jwtMgr.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", err
	}

	// Buscar usuario para obtener su email
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return "", ErrUserNotFound
	}

	// Generar nuevo access token
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

// GetUserByID obtiene un usuario por ID
func (s *AuthService) GetUserByID(id uuid.UUID) (*entities.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return user.ToResponse(), nil
}

// GetUserByIDStr obtiene un usuario por ID (desde string)
func (s *AuthService) GetUserByIDStr(idStr string) (*entities.UserResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return s.GetUserByID(id)
}