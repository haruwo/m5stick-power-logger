package main

import (
    "backend/db"
    "backend/handlers"
    "log"

    "github.com/gin-gonic/gin"
)

func main() {
    // データベース接続
    database, err := db.Connect()
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer database.Close()

    // Ginルーター設定
    router := gin.Default()
    
    // CORS設定
    router.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })

    // ハンドラー初期化
    itemHandler := handlers.NewItemHandler(database)

    // ルート設定
    api := router.Group("/api/v1")
    {
        api.GET("/items", itemHandler.GetItems)
    }

    // サーバー起動
    router.Run(":8080")
}