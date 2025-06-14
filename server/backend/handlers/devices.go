package handlers

import (
	"backend/models"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	db *sql.DB
}

func NewDeviceHandler(db *sql.DB) *DeviceHandler {
	return &DeviceHandler{db: db}
}

func (h *DeviceHandler) GetDevices(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, name, description, last_seen, created_at, updated_at FROM devices ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch devices"})
		return
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var device models.Device
		err := rows.Scan(&device.ID, &device.Name, &device.Description, &device.LastSeen, &device.CreatedAt, &device.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan device"})
			return
		}
		devices = append(devices, device)
	}

	c.JSON(http.StatusOK, devices)
}

func (h *DeviceHandler) GetDeviceByID(c *gin.Context) {
	deviceID := c.Param("deviceId")

	var device models.Device
	err := h.db.QueryRow("SELECT id, name, description, last_seen, created_at, updated_at FROM devices WHERE id = $1", deviceID).
		Scan(&device.ID, &device.Name, &device.Description, &device.LastSeen, &device.CreatedAt, &device.UpdatedAt)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device"})
		return
	}

	c.JSON(http.StatusOK, device)
}

func (h *DeviceHandler) UpdateDevice(c *gin.Context) {
	deviceID := c.Param("deviceId")
	
	var req models.DeviceUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.db.Exec(
		"UPDATE devices SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
		req.Name, req.Description, time.Now(), deviceID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get affected rows"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device updated successfully"})
}

func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	deviceID := c.Param("deviceId")

	// 関連する電源イベントを削除
	_, err := h.db.Exec("DELETE FROM power_events WHERE device_id = $1", deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete related power events"})
		return
	}

	// デバイスを削除
	result, err := h.db.Exec("DELETE FROM devices WHERE id = $1", deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete device"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get affected rows"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device deleted successfully"})
}