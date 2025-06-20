package handlers

import (
	"backend/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type PowerEventHandler struct {
	db *sql.DB
}

func NewPowerEventHandler(db *sql.DB) *PowerEventHandler {
	return &PowerEventHandler{db: db}
}

func (h *PowerEventHandler) CreatePowerEvent(c *gin.Context) {
	var req models.PowerEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create data JSON from the request fields
	dataJSON := map[string]interface{}{
		"client_timestamp":     req.Timestamp,
		"uptime_ms":            req.UptimeMs,
		"message":              req.Message,
		"battery_percentage":   req.BatteryPercentage,
		"battery_voltage":      req.BatteryVoltage,
		"wifi_signal_strength": req.WiFiSignalStrength,
		"free_heap":            req.FreeHeap,
	}

	dataBytes, err := json.Marshal(dataJSON)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal data JSON"})
		return
	}

	// デバイスの最終接続時刻を更新（UPSERT）
	_, err = h.db.Exec(`
		INSERT INTO devices (id, name, description, last_seen, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) 
		DO UPDATE SET last_seen = $4, updated_at = $6`,
		req.DeviceID, req.DeviceID, "", time.Now(), time.Now(), time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device"})
		return
	}

	// 電源イベントを挿入 (Use server timestamp)
	_, err = h.db.Exec(
		"INSERT INTO power_events (device_id, event_type, data, timestamp) VALUES ($1, $2, $3, $4)",
		req.DeviceID, req.EventType, string(dataBytes), time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create power event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Power event created successfully"})
}

func (h *PowerEventHandler) GetPowerEvents(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, device_id, event_type, timestamp, data, created_at FROM power_events ORDER BY timestamp DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch power events"})
		return
	}
	defer rows.Close()

	var events []models.PowerEvent
	for rows.Next() {
		var event models.PowerEvent
		err := rows.Scan(&event.ID, &event.DeviceID, &event.EventType, &event.Timestamp, &event.Data, &event.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan power event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func (h *PowerEventHandler) GetPowerEventByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var event models.PowerEvent
	err = h.db.QueryRow("SELECT id, device_id, event_type, timestamp, data, created_at FROM power_events WHERE id = $1", id).
		Scan(&event.ID, &event.DeviceID, &event.EventType, &event.Timestamp, &event.Data, &event.CreatedAt)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Power event not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch power event"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *PowerEventHandler) GetDeviceTimeline(c *gin.Context) {
	deviceID := c.Param("deviceId")

	rows, err := h.db.Query("SELECT id, device_id, event_type, timestamp, data, created_at FROM power_events WHERE device_id = $1 ORDER BY timestamp DESC", deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device timeline"})
		return
	}
	defer rows.Close()

	var events []models.PowerEvent
	for rows.Next() {
		var event models.PowerEvent
		err := rows.Scan(&event.ID, &event.DeviceID, &event.EventType, &event.Timestamp, &event.Data, &event.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan power event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func (h *PowerEventHandler) DeleteOldEvents(c *gin.Context) {
	var req struct {
		OlderThanDays int `json:"older_than_days" binding:"required,min=1"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate the cutoff date
	cutoffDate := time.Now().AddDate(0, 0, -req.OlderThanDays)
	
	// First, get the count of events to be deleted
	var count int
	err := h.db.QueryRow("SELECT COUNT(*) FROM power_events WHERE timestamp < $1", cutoffDate).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count events to delete"})
		return
	}
	
	// Delete the old events
	result, err := h.db.Exec("DELETE FROM power_events WHERE timestamp < $1", cutoffDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old events"})
		return
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get affected rows count"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Old events deleted successfully",
		"deleted_count": rowsAffected,
		"cutoff_date": cutoffDate.Format("2006-01-02 15:04:05"),
	})
}

func (h *PowerEventHandler) GetEventStats(c *gin.Context) {
	// Get total event count
	var totalCount int
	err := h.db.QueryRow("SELECT COUNT(*) FROM power_events").Scan(&totalCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total event count"})
		return
	}
	
	// Get oldest event timestamp
	var oldestTimestamp *time.Time
	err = h.db.QueryRow("SELECT MIN(timestamp) FROM power_events").Scan(&oldestTimestamp)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get oldest event timestamp"})
		return
	}
	
	// Get newest event timestamp  
	var newestTimestamp *time.Time
	err = h.db.QueryRow("SELECT MAX(timestamp) FROM power_events").Scan(&newestTimestamp)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get newest event timestamp"})
		return
	}
	
	// Get event counts by age
	var countLast7Days, countLast30Days, countLast90Days int
	
	now := time.Now()
	cutoff7Days := now.AddDate(0, 0, -7)
	cutoff30Days := now.AddDate(0, 0, -30)
	cutoff90Days := now.AddDate(0, 0, -90)
	
	h.db.QueryRow("SELECT COUNT(*) FROM power_events WHERE timestamp >= $1", cutoff7Days).Scan(&countLast7Days)
	h.db.QueryRow("SELECT COUNT(*) FROM power_events WHERE timestamp >= $1", cutoff30Days).Scan(&countLast30Days)
	h.db.QueryRow("SELECT COUNT(*) FROM power_events WHERE timestamp >= $1", cutoff90Days).Scan(&countLast90Days)
	
	stats := gin.H{
		"total_count": totalCount,
		"oldest_event": oldestTimestamp,
		"newest_event": newestTimestamp,
		"count_last_7_days": countLast7Days,
		"count_last_30_days": countLast30Days,
		"count_last_90_days": countLast90Days,
		"count_older_than_90_days": totalCount - countLast90Days,
	}
	
	c.JSON(http.StatusOK, stats)
}