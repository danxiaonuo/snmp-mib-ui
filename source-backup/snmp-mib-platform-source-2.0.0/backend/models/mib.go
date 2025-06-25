package models

import (
	"time"

	"gorm.io/gorm"
)

type MIB struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Filename    string         `json:"filename" gorm:"not null"`
	FilePath    string         `json:"file_path" gorm:"not null"`
	Version     string         `json:"version"`
	Description string         `json:"description"`
	Author      string         `json:"author"`
	Status      string         `json:"status" gorm:"default:'uploaded'"` // uploaded, parsed, error
	ParsedAt    *time.Time     `json:"parsed_at"`
	ErrorMsg    string         `json:"error_msg"`
	FileSize    int64          `json:"file_size"`
	Size        int64          `json:"size"`
	Checksum    string         `json:"checksum"`
	UploadedAt  time.Time      `json:"uploaded_at"`
	OIDs        []OID          `json:"oids" gorm:"foreignKey:MIBID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

type OID struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	MIBID       uint           `json:"mib_id" gorm:"not null"`
	Name        string         `json:"name" gorm:"not null"`
	OID         string         `json:"oid" gorm:"not null"`
	OIDString   string         `json:"oid_string" gorm:"not null"`
	Type        string         `json:"type"`        // INTEGER, OCTET STRING, etc.
	Access      string         `json:"access"`      // read-only, read-write, etc.
	Status      string         `json:"status"`      // current, deprecated, etc.
	Description string         `json:"description"`
	Syntax      string         `json:"syntax"`
	Units       string         `json:"units"`
	ParentOID   string         `json:"parent_oid"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
