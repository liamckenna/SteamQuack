package update

import (
	"log"
	"steamquack/backend/models"
	"steamquack/backend/steam"

	"gorm.io/gorm"
)

type UpdateService struct {
	scrapingService *steam.ScrapingService
	db              *gorm.DB
}

// creates a new database regeneration process
func NewUpdateService(scrapingService *steam.ScrapingService, db *gorm.DB) *UpdateService {
	return &UpdateService{
		scrapingService: scrapingService,
		db:              db,
	}
}

// clears existing entries and re-scrapes the Steam data
func (u *UpdateService) RegenerateDatabase() error {
	log.Println("Starting database regeneration process...")

	log.Println("Clearing existing game tags...")
	if err := u.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.GameTag{}).Error; err != nil {
		return err
	}

	log.Println("Clearing existing games...")
	if err := u.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Game{}).Error; err != nil {
		return err
	}

	// fetch up to 150,000 games to ensure we cover the entire Steam catalog
	log.Println("Initiating Steam scrape...")
	err := u.scrapingService.ScrapeGameData(150000)
	if err != nil {
		log.Printf("Error during database regeneration: %v\n", err)
		return err
	}

	log.Println("Database regeneration completed successfully.")
	return nil
}
