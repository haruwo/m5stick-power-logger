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

func TestGetDevices(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "name", "description", "last_seen", "created_at", "updated_at"}).
		AddRow("device-001", "M5StickC Device 1", "Test device", now, now, now).
		AddRow("device-002", "M5StickC Device 2", "Another test device", now, now, now)

	mock.ExpectQuery("SELECT (.+) FROM devices ORDER BY created_at DESC").
		WillReturnRows(rows)

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/devices", nil)

	// ハンドラー実行
	handler.GetDevices(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var devices []models.Device
	err = json.Unmarshal(w.Body.Bytes(), &devices)
	assert.NoError(t, err)
	assert.Len(t, devices, 2)
	assert.Equal(t, "device-001", devices[0].ID)
	assert.Equal(t, "M5StickC Device 1", devices[0].Name)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetDeviceByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "name", "description", "last_seen", "created_at", "updated_at"}).
		AddRow("device-001", "M5StickC Device 1", "Test device", now, now, now)

	mock.ExpectQuery("SELECT (.+) FROM devices WHERE id = \\$1").
		WithArgs("device-001").
		WillReturnRows(rows)

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/devices/device-001", nil)
	c.Params = gin.Params{{Key: "deviceId", Value: "device-001"}}

	// ハンドラー実行
	handler.GetDeviceByID(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var device models.Device
	err = json.Unmarshal(w.Body.Bytes(), &device)
	assert.NoError(t, err)
	assert.Equal(t, "device-001", device.ID)
	assert.Equal(t, "M5StickC Device 1", device.Name)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateDevice(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	req := models.DeviceUpdateRequest{
		Name:        "Updated Device Name",
		Description: "Updated description",
	}

	mock.ExpectExec("UPDATE devices SET name = \\$1, description = \\$2, updated_at = \\$3 WHERE id = \\$4").
		WithArgs(req.Name, req.Description, sqlmock.AnyArg(), "device-001").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	body, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/devices/device-001", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "deviceId", Value: "device-001"}}

	// ハンドラー実行
	handler.UpdateDevice(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Device updated successfully", response["message"])

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestDeleteDevice(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// 関連する電源イベントを削除
	mock.ExpectExec("DELETE FROM power_events WHERE device_id = \\$1").
		WithArgs("device-001").
		WillReturnResult(sqlmock.NewResult(0, 5))

	// デバイスを削除
	mock.ExpectExec("DELETE FROM devices WHERE id = \\$1").
		WithArgs("device-001").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/devices/device-001", nil)
	c.Params = gin.Params{{Key: "deviceId", Value: "device-001"}}

	// ハンドラー実行
	handler.DeleteDevice(c)

	// アサーション
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Device deleted successfully", response["message"])

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetDeviceByID_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	mock.ExpectQuery("SELECT (.+) FROM devices WHERE id = \\$1").
		WithArgs("nonexistent-device").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "description", "last_seen", "created_at", "updated_at"}))

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/devices/nonexistent-device", nil)
	c.Params = gin.Params{{Key: "deviceId", Value: "nonexistent-device"}}

	// ハンドラー実行
	handler.GetDeviceByID(c)

	// アサーション
	assert.Equal(t, http.StatusNotFound, w.Code)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateDevice_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// 無効なJSONでリクエスト作成
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/devices/device-001", bytes.NewBufferString("invalid json"))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "deviceId", Value: "device-001"}}

	// ハンドラー実行
	handler.UpdateDevice(c)

	// アサーション
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateDevice_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// モックDB作成
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// テストデータ
	req := models.DeviceUpdateRequest{
		Name:        "Updated Device Name",
		Description: "Updated description",
	}

	// 0行が更新された場合（デバイスが見つからない）
	mock.ExpectExec("UPDATE devices SET name = \\$1, description = \\$2, updated_at = \\$3 WHERE id = \\$4").
		WithArgs(req.Name, req.Description, sqlmock.AnyArg(), "nonexistent-device").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// ハンドラー作成
	handler := NewDeviceHandler(db)

	// リクエスト作成
	body, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/devices/nonexistent-device", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "deviceId", Value: "nonexistent-device"}}

	// ハンドラー実行
	handler.UpdateDevice(c)

	// アサーション
	assert.Equal(t, http.StatusNotFound, w.Code)

	// モックの期待値を満たしたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}