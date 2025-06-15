package models

import (
	"time"

	"gorm.io/gorm"
)

type Device struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Hostname    string         `json:"hostname"`
	IPAddress   string         `json:"ip_address" gorm:"not null"`
	Port        int            `json:"port" gorm:"default:161"`
	Type        string         `json:"type"`
	Vendor      string         `json:"vendor"`
	Model       string         `json:"model"`
	Location    string         `json:"location"`
	Description string         `json:"description"`
	Status      string         `json:"status" gorm:"default:'unknown'"` // online, offline, unknown
	LastSeen    *time.Time     `json:"last_seen"`
	TemplateID  *uint          `json:"template_id"`
	Template    *DeviceTemplate `json:"template" gorm:"foreignKey:TemplateID"`
	Credentials []SNMPCredential `json:"credentials" gorm:"foreignKey:DeviceID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type DeviceTemplate struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Type        string         `json:"type" gorm:"not null"`
	Vendor      string         `json:"vendor"`
	Description string         `json:"description"`
	MIBs        []MIB          `json:"mibs" gorm:"many2many:device_template_mibs;"`
	OIDs        []string       `json:"oids" gorm:"type:text[]"`
	Config      map[string]interface{} `json:"config" gorm:"type:jsonb"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type SNMPCredential struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DeviceID  uint           `json:"device_id" gorm:"not null"`
	Version   string         `json:"version" gorm:"not null"` // v1, v2c, v3
	Community string         `json:"community"`               // for v1, v2c
	Username  string         `json:"username"`                // for v3
	AuthProto string         `json:"auth_proto"`              // MD5, SHA
	AuthKey   string         `json:"auth_key"`
	PrivProto string         `json:"priv_proto"`              // DES, AES
	PrivKey   string         `json:"priv_key"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
