package models

import (
	"time"

	"gorm.io/gorm"
)

type Setting struct {
	Key         string         `json:"key" gorm:"primaryKey"`
	Value       string         `json:"value" gorm:"type:text"`
	Type        string         `json:"type" gorm:"default:'string'"` // string, number, boolean, json
	Category    string         `json:"category"`
	Description string         `json:"description"`
	IsPublic    bool           `json:"is_public" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
