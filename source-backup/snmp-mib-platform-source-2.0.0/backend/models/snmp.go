package models

import "time"

type SNMPRequest struct {
	Target    string            `json:"target" binding:"required"`
	Port      int               `json:"port"`
	Version   string            `json:"version" binding:"required"`
	Community string            `json:"community"`
	Username  string            `json:"username"`
	AuthProto string            `json:"auth_proto"`
	AuthKey   string            `json:"auth_key"`
	PrivProto string            `json:"priv_proto"`
	PrivKey   string            `json:"priv_key"`
	OID       string            `json:"oid" binding:"required"`
	Timeout   int               `json:"timeout"`
	Retries   int               `json:"retries"`
	MaxOIDs   int               `json:"max_oids"`
	Context   map[string]string `json:"context"`
}

type SNMPResponse struct {
	Success   bool                   `json:"success"`
	Message   string                 `json:"message"`
	Data      []SNMPResult           `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	Duration  string                 `json:"duration"`
	Stats     map[string]interface{} `json:"stats"`
}

type SNMPResult struct {
	OID   string      `json:"oid"`
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
	Name  string      `json:"name,omitempty"`
}

type SNMPSetRequest struct {
	SNMPRequest
	Value interface{} `json:"value" binding:"required"`
	Type  string      `json:"type" binding:"required"`
}

type BulkOperation struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"` // walk, get, set
	Status    string                 `json:"status"`
	Progress  int                    `json:"progress"`
	Total     int                    `json:"total"`
	Results   []SNMPResponse         `json:"results"`
	Errors    []string               `json:"errors"`
	StartTime time.Time              `json:"start_time"`
	EndTime   *time.Time             `json:"end_time"`
	Config    map[string]interface{} `json:"config"`
}
