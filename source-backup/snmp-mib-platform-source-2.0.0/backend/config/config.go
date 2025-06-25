package config

import (
	"os"
)

type Config struct {
	Environment string
	Port        string
	JWTSecret   string
	UploadPath  string
}

func Load() *Config {
	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("SERVER_PORT", "17880"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
		UploadPath:  getEnv("UPLOAD_PATH", "./uploads"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
