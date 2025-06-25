package database

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"mib-platform/models"
)

func Initialize() (*gorm.DB, error) {
	log.Println("Initializing SQLite database...")
	
	db, err := gorm.Open(sqlite.Open("snmp_platform.db"), &gorm.Config{
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

	log.Println("SQLite database connected and migrated successfully")
	return db, nil
}