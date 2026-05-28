package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/finansystem/internal/application/services"
	"github.com/finansystem/internal/delivery/handlers"
	"github.com/finansystem/internal/delivery/middleware"
	"github.com/finansystem/internal/infrastructure/db"
	"github.com/finansystem/internal/infrastructure/repositories"
	"github.com/finansystem/internal/infrastructure/security"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Database struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		DBName   string `yaml:"name"`
		SSLMode  string `yaml:"sslmode"`
	} `yaml:"database"`
	JWT struct {
		Secret             string `yaml:"secret"`
		AccessTokenExpiry  string `yaml:"access_token_expiry"`
		RefreshTokenExpiry string `yaml:"refresh_token_expiry"`
	} `yaml:"jwt"`
	App struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
		Env  string `yaml:"env"`
	} `yaml:"app"`
}

func main() {
	// Cargar configuración
	cfg := loadConfig()

	// Inicializar base de datos
	dbConfig := db.Config{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
		SSLMode:  cfg.Database.SSLMode,
	}

	// Debug: verificar que la configuración se cargó correctamente
	log.Printf("DEBUG - Database Config: Host=%s, Port=%d, User=%s, Password=%s, DBName=%s, SSLMode=%s",
		dbConfig.Host, dbConfig.Port, dbConfig.User, dbConfig.Password, dbConfig.DBName, dbConfig.SSLMode)

	database, err := db.NewConnection(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Ejecutar migraciones
	if err := db.Migrate(database); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Inicializar JWT Manager
	accessExpiry, _ := time.ParseDuration(cfg.JWT.AccessTokenExpiry)
	refreshExpiry, _ := time.ParseDuration(cfg.JWT.RefreshTokenExpiry)
	jwtConfig := security.JWTConfig{
		Secret:             cfg.JWT.Secret,
		AccessTokenExpiry:  accessExpiry,
		RefreshTokenExpiry: refreshExpiry,
	}
	jwtMgr := security.NewJWTManager(jwtConfig)

	// Inicializar repositorios
	userRepo := repositories.NewUserRepository(database)
	sesionRepo := repositories.NewSesionRepository(database)
	movimientoRepo := repositories.NewMovimientoRepository(database)
	refuerzoRepo := repositories.NewRefuerzoRepository(database)

	// Inicializar servicios
	authService := services.NewAuthService(userRepo, jwtMgr)
	sesionService := services.NewSesionService(sesionRepo, movimientoRepo, refuerzoRepo)
	movimientoService := services.NewMovimientoService(movimientoRepo, sesionRepo)
	refuerzoService := services.NewRefuerzoService(refuerzoRepo, sesionRepo)

	// Inicializar handlers
	authHandler := handlers.NewAuthHandler(authService)
	sesionHandler := handlers.NewSesionHandler(sesionService)
	movimientoHandler := handlers.NewMovimientoHandler(movimientoService)
	refuerzoHandler := handlers.NewRefuerzoHandler(refuerzoService)
	updateHandler := handlers.NewUpdateHandler(movimientoService, refuerzoService)

	// Configurar Gin
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// Configuración CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://18.117.195.172"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Timezone"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rutas públicas
	router.POST("/api/users/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)
	router.POST("/api/auth/refresh", authHandler.Refresh)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Rutas protegidas
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(jwtMgr))
	{
		// Auth
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/users/me", authHandler.GetMe)

		// Sesiones
		protected.POST("/sesiones", sesionHandler.Crear)
		protected.GET("/sesiones", sesionHandler.ObtenerTodas)
		protected.GET("/sesiones/abierta", sesionHandler.ObtenerAbierta)
		protected.GET("/sesiones/ultima-cerrada", sesionHandler.ObtenerUltimaCerrada)
		protected.GET("/sesiones/:id", sesionHandler.Obtener)
		protected.GET("/sesiones/:id/detalle", sesionHandler.ObtenerDetalle)
		protected.POST("/sesiones/:id/close", sesionHandler.Cerrar)
		protected.PUT("/sesiones/:id", sesionHandler.ModificarSesion)
		protected.DELETE("/sesiones/:id", sesionHandler.EliminarSesion)

		// Reportes
		protected.GET("/reportes/semanal", sesionHandler.ObtenerReporteSemanal)
		protected.GET("/reportes/mensual", sesionHandler.ObtenerReporteMensual)
		protected.GET("/reportes/mensual/exportar", sesionHandler.ExportarReporteMensualCSV)

		// Movimientos
		protected.POST("/movimientos", movimientoHandler.Crear)
		protected.PUT("/movimientos/:id", updateHandler.ActualizarMovimiento)
		protected.DELETE("/movimientos/:id", movimientoHandler.Eliminar)
		protected.GET("/movimientos", movimientoHandler.ObtenerPorSesion)

		// Refuerzos
		protected.POST("/refuerzos", refuerzoHandler.Crear)
		protected.PUT("/refuerzos/:id", updateHandler.ActualizarRefuerzo)
		protected.DELETE("/refuerzos/:id", refuerzoHandler.Eliminar)
		protected.GET("/refuerzos", refuerzoHandler.ObtenerPorSesion)
	}

	// Iniciar servidor
	addr := fmt.Sprintf("%s:%d", cfg.App.Host, cfg.App.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func loadConfig() Config {
	// Intentar cargar .env primero
	_ = godotenv.Load()

	// Luego cargar config.yaml
	configFile := "configs/config.yaml"
	if os.Getenv("CONFIG_PATH") != "" {
		configFile = os.Getenv("CONFIG_PATH")
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		log.Fatalf("Failed to read config file: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		log.Fatalf("Failed to parse config file: %v", err)
	}

	// Permitir sobrescribir con variables de entorno
	if os.Getenv("DB_HOST") != "" {
		cfg.Database.Host = os.Getenv("DB_HOST")
	}
	if os.Getenv("DB_PORT") != "" {
		fmt.Sscanf(os.Getenv("DB_PORT"), "%d", &cfg.Database.Port)
	}
	if os.Getenv("JWT_SECRET") != "" {
		cfg.JWT.Secret = os.Getenv("JWT_SECRET")
	}

	return cfg
}
