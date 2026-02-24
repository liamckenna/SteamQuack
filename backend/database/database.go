package database

import (
	"log"
	"steamquack/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// initializes the SQLite database connection and runs migrations
func InitDatabase() {
	var err error

	// Connect to SQLite database
	DB, err = gorm.Open(sqlite.Open("steamquack.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Successfully connected to SQLite database")

	// Auto-migrate the schema
	err = DB.AutoMigrate(
		&models.Game{},
		&models.GameTag{},
		&models.UserReview{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed successfully")
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Println("Error getting underlying sql.DB:", err)
		return
	}

	if err := sqlDB.Close(); err != nil {
		log.Println("Error closing database:", err)
		return
	}

	log.Println("Database connection closed successfully")
}
