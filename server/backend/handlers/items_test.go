package handlers

import (
    "backend/models"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/DATA-DOG/go-sqlmock"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestGetItems(t *testing.T) {
    gin.SetMode(gin.TestMode)

    // モックDB作成
    db, mock, err := sqlmock.New()
    assert.NoError(t, err)
    defer db.Close()

    // テストデータ
    rows := sqlmock.NewRows([]string{"id", "name", "description", "created_at"}).
        AddRow(1, "Item 1", "Description 1", time.Now().Format(time.RFC3339)).
        AddRow(2, "Item 2", "Description 2", time.Now().Format(time.RFC3339))

    mock.ExpectQuery("SELECT id, name, description, created_at FROM items ORDER BY id").
        WillReturnRows(rows)

    // ハンドラー作成
    handler := NewItemHandler(db)

    // リクエスト作成
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    c.Request, _ = http.NewRequest("GET", "/api/v1/items", nil)

    // ハンドラー実行
    handler.GetItems(c)

    // アサーション
    assert.Equal(t, http.StatusOK, w.Code)

    var items []models.Item
    err = json.Unmarshal(w.Body.Bytes(), &items)
    assert.NoError(t, err)
    assert.Len(t, items, 2)
    assert.Equal(t, "Item 1", items[0].Name)
    assert.Equal(t, "Item 2", items[1].Name)

    // モックの期待値を満たしたか確認
    assert.NoError(t, mock.ExpectationsWereMet())
}