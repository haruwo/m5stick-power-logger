package models

import "time"

type PowerEvent struct {
	ID        int       `json:"id" db:"id"`
	DeviceID  string    `json:"device_id" db:"device_id"`
	EventType string    `json:"event_type" db:"event_type"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
	Data      string    `json:"data,omitempty" db:"data"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Device struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description,omitempty" db:"description"`
	LastSeen    time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type PowerEventRequest struct {
	DeviceID  string `json:"device_id" binding:"required"`
	EventType string `json:"event_type" binding:"required"`
	Data      string `json:"data,omitempty"`
}

type DeviceUpdateRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}