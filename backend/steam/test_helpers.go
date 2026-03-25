package steam

import (
	"log"
	"steamquack/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestDB creates an in-memory SQLite database for testing
func SetupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to create in-memory database: %v", err)
	}

	// Auto-migrate all models
	err = db.AutoMigrate(
		&models.Game{},
		&models.GameTag{},
		&models.UserReview{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate models: %v", err)
	}

	return db
}

// CloseTestDB closes the test database connection
func CloseTestDB(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get database: %v", err)
		return
	}
	sqlDB.Close()
}
