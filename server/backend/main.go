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
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })

    // ハンドラー初期化
    itemHandler := handlers.NewItemHandler(database)
    powerEventHandler := handlers.NewPowerEventHandler(database)
    deviceHandler := handlers.NewDeviceHandler(database)

    // ルート設定
    api := router.Group("/api")
    {
        // Legacy API
        v1 := api.Group("/v1")
        {
            v1.GET("/items", itemHandler.GetItems)
        }

        // Power Events API
        api.POST("/power-events", powerEventHandler.CreatePowerEvent)
        api.GET("/power-events", powerEventHandler.GetPowerEvents)
        api.GET("/power-events/:id", powerEventHandler.GetPowerEventByID)
        api.GET("/power-events/device/:deviceId/timeline", powerEventHandler.GetDeviceTimeline)
        api.GET("/power-events/stats", powerEventHandler.GetEventStats)
        api.DELETE("/power-events/cleanup", powerEventHandler.DeleteOldEvents)

        // Device Management API
        api.GET("/devices", deviceHandler.GetDevices)
        api.GET("/devices/:deviceId", deviceHandler.GetDeviceByID)
        api.PUT("/devices/:deviceId", deviceHandler.UpdateDevice)
        api.DELETE("/devices/:deviceId", deviceHandler.DeleteDevice)
    }

    // サーバー起動
    router.Run(":8080")
}