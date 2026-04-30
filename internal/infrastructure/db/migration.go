package db

import (
	"log"

	"github.com/finansystem/internal/domain/entities"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(
		&entities.User{},
		&entities.SesionDiaria{},
		&entities.Movimiento{},
		&entities.Refuerzo{},
	)
	if err != nil {
		return err
	}

	log.Println("✅ Database migrations completed")
	return nil
}