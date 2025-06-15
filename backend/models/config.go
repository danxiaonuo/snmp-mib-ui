package models

import (
	"time"

	"gorm.io/gorm"
)

type Config struct {
	ID          uint             `json:"id" gorm:"primaryKey"`
	Name        string           `json:"name" gorm:"not null"`
	Type        string           `json:"type" gorm:"not null"` // prometheus, zabbix, etc.
	Content     string           `json:"content" gorm:"type:text"`
	FilePath    string           `json:"file_path"`
	DeviceID    *uint            `json:"device_id"`
	Device      *Device          `json:"device" gorm:"foreignKey:DeviceID"`
	TemplateID  *uint            `json:"template_id"`
	Template    *ConfigTemplate  `json:"template" gorm:"foreignKey:TemplateID"`
	Status      string           `json:"status" gorm:"default:'draft'"` // draft, active, deprecated
	Version     string           `json:"version"`
	Versions    []ConfigVersion  `json:"versions" gorm:"foreignKey:ConfigID"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `json:"deleted_at" gorm:"index"`
}

type ConfigTemplate struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Type        string         `json:"type" gorm:"not null"`
	Description string         `json:"description"`
	Template    string         `json:"template" gorm:"type:text"`
	Variables   map[string]interface{} `json:"variables" gorm:"type:jsonb"`
	IsDefault   bool           `json:"is_default" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type ConfigVersion struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	ConfigID  uint           `json:"config_id" gorm:"not null"`
	Version   string         `json:"version" gorm:"not null"`
	Content   string         `json:"content" gorm:"type:text"`
	Changes   string         `json:"changes" gorm:"type:text"`
	CreatedBy string         `json:"created_by"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
