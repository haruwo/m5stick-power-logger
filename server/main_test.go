package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])
}

func TestCreatePowerEvent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	powerEvent := PowerEvent{
		DeviceID:  "test-device-1",
		EventType: "power_on",
		Timestamp: time.Now(),
		BatteryLevel: 85,
		Voltage:   3.7,
	}
	
	jsonData, _ := json.Marshal(powerEvent)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/power-events", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 201, w.Code)
	
	var response PowerEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, powerEvent.DeviceID, response.DeviceID)
	assert.Equal(t, powerEvent.EventType, response.EventType)
}

func TestGetPowerEvents(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/power-events", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []PowerEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []PowerEvent{}, response)
}

func TestGetPowerEvent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/power-events/999", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 404, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Power event not found", response["error"])
}

func TestGetDeviceTimeline(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/power-events/device/test-device-1/timeline", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []TimelineEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []TimelineEvent{}, response)
}

func TestGetDevices(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/devices", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []Device
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []Device{}, response)
}

func TestGetDevice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/devices/nonexistent", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 404, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Device not found", response["error"])
}

func TestUpdateDevice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	updateData := map[string]interface{}{
		"name":        "Updated Device",
		"description": "Updated Description",
	}
	
	jsonData, _ := json.Marshal(updateData)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/devices/test-device-1", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response Device
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "test-device-1", response.ID)
	assert.Equal(t, "Updated Device", response.Name)
}

func TestDeleteDevice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/devices/nonexistent", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 404, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Device not found", response["error"])
}

func TestGetAnalyticsSummary(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/analytics/summary", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response AnalyticsSummary
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, response.TotalEvents, 0)
}

func TestGetCalendarData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/analytics/calendar/2024/1", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []CalendarEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []CalendarEvent{}, response)
}

func TestGetTimeline(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/analytics/timeline", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []TimelineEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []TimelineEvent{}, response)
}

func TestGetTimelineWithDeviceFilter(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/analytics/timeline?device_id=test-device-1", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
	
	var response []TimelineEvent
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.IsType(t, []TimelineEvent{}, response)
}

func TestGetDeviceHealth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/analytics/device/nonexistent/health", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, 404, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Device not found or no recent data", response["error"])
}