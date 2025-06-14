package handlers

import (
    "backend/models"
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
)

type ItemHandler struct {
    db *sql.DB
}

func NewItemHandler(db *sql.DB) *ItemHandler {
    return &ItemHandler{db: db}
}

func (h *ItemHandler) GetItems(c *gin.Context) {
    query := `SELECT id, name, description, created_at FROM items ORDER BY id`
    rows, err := h.db.Query(query)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var items []models.Item
    for rows.Next() {
        var item models.Item
        err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.CreatedAt)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        items = append(items, item)
    }

    c.JSON(http.StatusOK, items)
}