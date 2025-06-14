package handlers

import (
	"backend/models"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCreatePowerEvent(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	req := models.PowerEventRequest{
		DeviceID:           "device-001",
		Timestamp:          time.Now(),
		UptimeMs:           1000,
		EventType:          "power_on",
		Message:            "Device powered on",
		BatteryPercentage:  80,
		BatteryVoltage:     3.3,
		WiFiSignalStrength: -50,
		FreeHeap:           100000,
	}

	// リクエストデータをJSONに変換
	dataJSON := map[string]interface{}{
		"client_timestamp":     req.Timestamp,
		"uptime_ms":            req.UptimeMs,
		"message":              req.Message,
		"battery_percentage":   req.BatteryPercentage,
		"battery_voltage":      req.BatteryVoltage,
		"wifi_signal_strength": req.WiFiSignalStrength,
		"free_heap":            req.FreeHeap,
	}
	data, err := json.Marshal(dataJSON)
	assert.NoError(t, err)

	mock.ExpectExec("INSERT INTO power_events").
		WithArgs(req.DeviceID, req.EventType, string(data), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// デバイスの最終接続時刻を更新
	mock.ExpectExec("INSERT INTO devices").
		WithArgs(req.DeviceID, req.DeviceID, "", sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// リクエスト作成
	body, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/power-events", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	// ハンドラー実行
	handler.CreatePowerEvent(c)

	// アサーション
	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Power event created successfully", response["message"])

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetPowerEvents(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	now := time.Now()
	dataJSON1 := map[string]interface{}{
		"client_timestamp":     now,
		"uptime_ms":            1000,
		"message":              "Device powered on",
		"battery_percentage":   80,
		"battery_voltage":      3.3,
		"wifi_signal_strength": -50,
		"free_heap":            100000,
	}
	data1, _ := json.Marshal(dataJSON1)

	dataJSON2 := map[string]interface{}{
		"client_timestamp":     now,
		"uptime_ms":            2000,
		"message":              "Device powered off",
		"battery_percentage":   75,
		"battery_voltage":      3.2,
		"wifi_signal_strength": -55,
		"free_heap":            95000,
	}
	data2, _ := json.Marshal(dataJSON2)

	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, string(data1), now).
		AddRow(2, "device-001", "power_off", now, string(data2), now)

	mock.ExpectQuery("SELECT (.+) FROM power_events ORDER BY timestamp DESC").
		WillReturnRows(rows)

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/power-events", nil)

	// ハンドラー実行
	handler.GetPowerEvents(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var events []models.PowerEvent
	err = json.Unmarshal(w.Body.Bytes(), &events)
	assert.NoError(t, err)
	assert.Len(t, events, 2)
	assert.Equal(t, "device-001", events[0].DeviceID)
	assert.Equal(t, "power_on", events[0].EventType)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetPowerEventByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	now := time.Now()
	dataJSON := map[string]interface{}{
		"client_timestamp":     now,
		"uptime_ms":            1000,
		"message":              "Device powered on",
		"battery_percentage":   80,
		"battery_voltage":      3.3,
		"wifi_signal_strength": -50,
		"free_heap":            100000,
	}
	data, _ := json.Marshal(dataJSON)

	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, string(data), now)

	mock.ExpectQuery("SELECT (.+) FROM power_events WHERE id = \\$1").
		WithArgs(1).
		WillReturnRows(rows)

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/power-events/1", nil)
	c.Params = gin.Params{{Key: "id", Value: "1"}}

	// ハンドラー実行
	handler.GetPowerEventByID(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var event models.PowerEvent
	err = json.Unmarshal(w.Body.Bytes(), &event)
	assert.NoError(t, err)
	assert.Equal(t, 1, event.ID)
	assert.Equal(t, "device-001", event.DeviceID)
	assert.Equal(t, "power_on", event.EventType)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetDeviceTimeline(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	now := time.Now()
	dataJSON1 := map[string]interface{}{
		"client_timestamp":     now,
		"uptime_ms":            1000,
		"message":              "Device powered on",
		"battery_percentage":   80,
		"battery_voltage":      3.3,
		"wifi_signal_strength": -50,
		"free_heap":            100000,
	}
	data1, _ := json.Marshal(dataJSON1)

	dataJSON2 := map[string]interface{}{
		"client_timestamp":     now.Add(-time.Hour),
		"uptime_ms":            2000,
		"message":              "Device powered off",
		"battery_percentage":   75,
		"battery_voltage":      3.2,
		"wifi_signal_strength": -55,
		"free_heap":            95000,
	}
	data2, _ := json.Marshal(dataJSON2)

	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, string(data1), now).
		AddRow(2, "device-001", "power_off", now.Add(-time.Hour), string(data2), now.Add(-time.Hour))

	mock.ExpectQuery("SELECT (.+) FROM power_events WHERE device_id = \\$1 ORDER BY timestamp DESC").
		WithArgs("device-001").
		WillReturnRows(rows)

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/power-events/device/device-001/timeline", nil)
	c.Params = gin.Params{{Key: "deviceId", Value: "device-001"}}

	// ハンドラー実行
	handler.GetDeviceTimeline(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var events []models.PowerEvent
	err = json.Unmarshal(w.Body.Bytes(), &events)
	assert.NoError(t, err)
	assert.Len(t, events, 2)
	assert.Equal(t, "device-001", events[0].DeviceID)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCreatePowerEvent_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// 無効なJSONでリクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/power-events", bytes.NewBufferString("invalid json"))
	c.Request.Header.Set("Content-Type", "application/json")

	// ハンドラー実行
	handler.CreatePowerEvent(c)

	// アサーション
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetPowerEventByID_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	mock.ExpectQuery("SELECT (.+) FROM power_events WHERE id = \\$1").
		WithArgs(999).
		WillReturnRows(sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}))

	// ハンドラー作成
	handler := NewPowerEventHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/power-events/999", nil)
	c.Params = gin.Params{{Key: "id", Value: "999"}}

	// ハンドラー実行
	handler.GetPowerEventByID(c)

	// アサーション
	assert.Equal(t, http.StatusNotFound, w.Code)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}