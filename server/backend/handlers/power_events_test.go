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
		DeviceID:  "device-001",
		EventType: "power_on",
		Data:      `{"voltage": 3.3, "current": 0.5}`,
	}

	mock.ExpectExec("INSERT INTO power_events").
		WithArgs(req.DeviceID, req.EventType, req.Data, sqlmock.AnyArg()).
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
	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, `{"voltage": 3.3}`, now).
		AddRow(2, "device-001", "power_off", now, `{"voltage": 0.0}`, now)

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
	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, `{"voltage": 3.3}`, now)

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
	rows := sqlmock.NewRows([]string{"id", "device_id", "event_type", "timestamp", "data", "created_at"}).
		AddRow(1, "device-001", "power_on", now, `{"voltage": 3.3}`, now).
		AddRow(2, "device-001", "power_off", now.Add(-time.Hour), `{"voltage": 0.0}`, now.Add(-time.Hour))

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