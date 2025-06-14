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