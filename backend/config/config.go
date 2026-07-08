package config

import (
	"log"
	"os"
)

// Config holds all configuration values
type Config struct {
	SteamAPIKey  string
	DatabasePath string
	ServerPort   string
	FrontendURL  string
	BackendURL   string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	steamAPIKey := os.Getenv("STEAM_API_KEY")
	if steamAPIKey == "" {
		log.Fatal("STEAM_API_KEY environment variable is required. Please set it before running the application.")
	}

	return &Config{
		SteamAPIKey:  steamAPIKey,
		DatabasePath: getEnvOrDefault("DATABASE_PATH", "steamquack.db"),
		ServerPort:   getEnvOrDefault("SERVER_PORT", "8080"),
		/*FrontendURL:  getEnvOrDefault("FRONTEND_URL", "https://liamckenna.github.io"),
		BackendURL:   getEnvOrDefault("BACKEND_URL", "https://steamquack.fly.dev"),*/
		FrontendURL: getEnvOrDefault("FRONTEND_URL", "https://www.steamquack.com"),
		BackendURL:  getEnvOrDefault("BACKEND_URL", "https://steamquack.fly.dev"),
	}
}

// getEnvOrDefault returns environment variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
