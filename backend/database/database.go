package database

import (
	"log"

	"github.com/go-redis/redis/v8"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"mib-platform/models"
)

func Initialize(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(
		&models.MIB{},
		&models.OID{},
		&models.Device{},
		&models.DeviceTemplate{},
		&models.Config{},
		&models.ConfigTemplate{},
		&models.ConfigVersion{},
		&models.SNMPCredential{},
		&models.Setting{},
		&models.Host{},
		&models.HostComponent{},
		&models.HostDiscoveryTask{},
		&models.HostCredential{},
	)
	if err != nil {
		return nil, err
	}

	log.Println("Database connected and migrated successfully")
	return db, nil
}

func InitializeRedis(redisURL string) *redis.Client {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}

	rdb := redis.NewClient(opt)
	log.Println("Redis connected successfully")
	return rdb
}
