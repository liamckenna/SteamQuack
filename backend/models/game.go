package models

import (
	"time"

	"gorm.io/gorm"
)

type Game struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	AppID            uint32         `gorm:"uniqueIndex;not null" json:"app_id"`
	Name             string         `gorm:"not null" json:"name"`
	Description      string         `gorm:"type:text" json:"description"`
	InitialPrice     float64        `json:"initial_price"`
	CurrentPrice     float64        `json:"current_price"`
	ReleaseDate      time.Time      `json:"release_date"`
	ReleaseDateUnix  int64          `json:"release_date_unix"`
	ReviewCount      int            `json:"review_count"`
	ReviewPercentage float64        `json:"review_percentage"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tags    []GameTag    `gorm:"foreignKey:GameID" json:"tags"`
	Reviews []UserReview `gorm:"foreignKey:GameID" json:"reviews"`
}

type GameTag struct {
	ID      uint    `gorm:"primaryKey" json:"id"`
	GameID  uint    `gorm:"not null;index" json:"game_id"`
	TagName string  `gorm:"not null" json:"tag_name"`
	Weight  float64 `gorm:"default:1.0" json:"weight"`

	// Foreign key relationship
	Game Game `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

// UserReview represents a single user review for a game
type UserReview struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	GameID           uint      `gorm:"not null;index" json:"game_id"`
	SteamUserID      string    `json:"steam_user_id"`
	AuthorID         int       `json:"author_id"`
	ReviewText       string    `gorm:"type:text" json:"review_text"`
	IsPositive       bool      `json:"is_positive"`
	HelpfulCount     int       `json:"helpful_count"`
	PlaytimeAtReview int       `json:"playtime_at_review"`
	ReviewDate       time.Time `json:"review_date"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Foreign key relationship
	Game Game `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
