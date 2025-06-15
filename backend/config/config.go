package config

import (
	"fmt"
	"os"
)

type Config struct {
	Environment   string
	Port          string
	DatabaseURL   string
	RedisURL      string
	JWTSecret     string
	UploadPath    string
	PrometheusURL string
}

func Load() *Config {
	// Build database URL from individual components
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "netmon_user")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "network_monitor")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")
	
	databaseURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode)
	
	// Build Redis URL from individual components
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	redisDB := getEnv("REDIS_DB", "0")
	
	var redisURL string
	if redisPassword != "" {
		redisURL = fmt.Sprintf("redis://:%s@%s:%s/%s", redisPassword, redisHost, redisPort, redisDB)
	} else {
		redisURL = fmt.Sprintf("redis://%s:%s/%s", redisHost, redisPort, redisDB)
	}
	
	return &Config{
		Environment:   getEnv("ENVIRONMENT", "development"),
		Port:          getEnv("SERVER_PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", databaseURL),
		RedisURL:      getEnv("REDIS_URL", redisURL),
		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key"),
		UploadPath:    getEnv("UPLOAD_PATH", "./uploads"),
		PrometheusURL: getEnv("PROMETHEUS_URL", "http://localhost:8428"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
