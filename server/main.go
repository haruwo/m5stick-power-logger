package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type PowerEvent struct {
	ID           int       `json:"id" db:"id"`
	DeviceID     string    `json:"device_id" db:"device_id"`
	EventType    string    `json:"event_type" db:"event_type"`
	Timestamp    time.Time `json:"timestamp" db:"timestamp"`
	BatteryLevel int       `json:"battery_level" db:"battery_level"`
	Voltage      float64   `json:"voltage" db:"voltage"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Device struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	LastSeen    time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type AnalyticsSummary struct {
	TotalEvents       int     `json:"total_events"`
	ActiveDevices     int     `json:"active_devices"`
	AverageBattery    float64 `json:"average_battery"`
	LastEventTime     time.Time `json:"last_event_time"`
	PowerOnEvents     int     `json:"power_on_events"`
	PowerOffEvents    int     `json:"power_off_events"`
}

type CalendarEvent struct {
	Date        string `json:"date"`
	EventCount  int    `json:"event_count"`
	PowerOnCount int   `json:"power_on_count"`
	PowerOffCount int  `json:"power_off_count"`
}

type TimelineEvent struct {
	ID           int       `json:"id"`
	DeviceID     string    `json:"device_id"`
	EventType    string    `json:"event_type"`
	Timestamp    time.Time `json:"timestamp"`
	BatteryLevel int       `json:"battery_level"`
	Voltage      float64   `json:"voltage"`
}

type DeviceHealth struct {
	DeviceID         string    `json:"device_id"`
	LastSeen         time.Time `json:"last_seen"`
	LastBatteryLevel int       `json:"last_battery_level"`
	LastVoltage      float64   `json:"last_voltage"`
	DailyEvents      int       `json:"daily_events"`
	HealthStatus     string    `json:"health_status"`
}

var db *sql.DB

func main() {
	initDB()
	defer db.Close()

	router := setupRouter()
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	
	log.Printf("Server starting on port %s", port)
	router.Run(":" + port)
}

func initDB() {
	var err error
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err = sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	createTables()
	log.Println("Database connected successfully")
}

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS power_events (
		id SERIAL PRIMARY KEY,
		device_id VARCHAR(255) NOT NULL,
		event_type VARCHAR(50) NOT NULL,
		timestamp TIMESTAMP NOT NULL,
		battery_level INTEGER,
		voltage DECIMAL(4,2),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE TABLE IF NOT EXISTS devices (
		id VARCHAR(255) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		last_seen TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX IF NOT EXISTS idx_power_events_device_id ON power_events(device_id);
	CREATE INDEX IF NOT EXISTS idx_power_events_timestamp ON power_events(timestamp);
	CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
	`
	
	if _, err := db.Exec(query); err != nil {
		log.Fatal("Failed to create tables:", err)
	}
}

func setupRouter() *gin.Engine {
	router := gin.Default()
	
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	router.Use(cors.New(config))
	
	router.GET("/health", healthCheck)
	
	api := router.Group("/api")
	{
		api.POST("/power-events", createPowerEvent)
		api.GET("/power-events", getPowerEvents)
		api.GET("/power-events/:id", getPowerEvent)
		api.GET("/power-events/device/:deviceId/timeline", getDeviceTimeline)
		
		api.GET("/devices", getDevices)
		api.GET("/devices/:deviceId", getDevice)
		api.PUT("/devices/:deviceId", updateDevice)
		api.DELETE("/devices/:deviceId", deleteDevice)
		
		api.GET("/analytics/summary", getAnalyticsSummary)
		api.GET("/analytics/calendar/:year/:month", getCalendarData)
		api.GET("/analytics/timeline", getTimeline)
		api.GET("/analytics/device/:deviceId/health", getDeviceHealth)
	}
	
	return router
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"timestamp": time.Now(),
	})
}

func createPowerEvent(c *gin.Context) {
	var event PowerEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		INSERT INTO power_events (device_id, event_type, timestamp, battery_level, voltage)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	
	err := db.QueryRow(query, event.DeviceID, event.EventType, event.Timestamp, 
		event.BatteryLevel, event.Voltage).Scan(&event.ID, &event.CreatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create power event"})
		return
	}

	// Update device last_seen
	updateDeviceQuery := `
		INSERT INTO devices (id, name, last_seen)
		VALUES ($1, $1, $2)
		ON CONFLICT (id) DO UPDATE SET
			last_seen = EXCLUDED.last_seen,
			updated_at = CURRENT_TIMESTAMP
	`
	db.Exec(updateDeviceQuery, event.DeviceID, event.Timestamp)

	c.JSON(http.StatusCreated, event)
}

func getPowerEvents(c *gin.Context) {
	query := `
		SELECT id, device_id, event_type, timestamp, battery_level, voltage, created_at
		FROM power_events
		ORDER BY timestamp DESC
		LIMIT 100
	`
	
	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch power events"})
		return
	}
	defer rows.Close()

	var events []PowerEvent
	for rows.Next() {
		var event PowerEvent
		err := rows.Scan(&event.ID, &event.DeviceID, &event.EventType, 
			&event.Timestamp, &event.BatteryLevel, &event.Voltage, &event.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan power event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func getPowerEvent(c *gin.Context) {
	id := c.Param("id")
	
	query := `
		SELECT id, device_id, event_type, timestamp, battery_level, voltage, created_at
		FROM power_events
		WHERE id = $1
	`
	
	var event PowerEvent
	err := db.QueryRow(query, id).Scan(&event.ID, &event.DeviceID, &event.EventType,
		&event.Timestamp, &event.BatteryLevel, &event.Voltage, &event.CreatedAt)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Power event not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch power event"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// Device Timeline Endpoint
func getDeviceTimeline(c *gin.Context) {
	deviceId := c.Param("deviceId")
	limit := c.DefaultQuery("limit", "50")
	
	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		limitInt = 50
	}
	
	query := `
		SELECT id, device_id, event_type, timestamp, battery_level, voltage
		FROM power_events
		WHERE device_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`
	
	rows, err := db.Query(query, deviceId, limitInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device timeline"})
		return
	}
	defer rows.Close()

	var events []TimelineEvent
	for rows.Next() {
		var event TimelineEvent
		err := rows.Scan(&event.ID, &event.DeviceID, &event.EventType,
			&event.Timestamp, &event.BatteryLevel, &event.Voltage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan timeline event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

// Device Management Endpoints
func getDevices(c *gin.Context) {
	query := `
		SELECT id, name, description, last_seen, created_at, updated_at
		FROM devices
		ORDER BY last_seen DESC
	`
	
	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch devices"})
		return
	}
	defer rows.Close()

	var devices []Device
	for rows.Next() {
		var device Device
		err := rows.Scan(&device.ID, &device.Name, &device.Description,
			&device.LastSeen, &device.CreatedAt, &device.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan device"})
			return
		}
		devices = append(devices, device)
	}

	c.JSON(http.StatusOK, devices)
}

func getDevice(c *gin.Context) {
	deviceId := c.Param("deviceId")
	
	query := `
		SELECT id, name, description, last_seen, created_at, updated_at
		FROM devices
		WHERE id = $1
	`
	
	var device Device
	err := db.QueryRow(query, deviceId).Scan(&device.ID, &device.Name,
		&device.Description, &device.LastSeen, &device.CreatedAt, &device.UpdatedAt)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device"})
		return
	}

	c.JSON(http.StatusOK, device)
}

func updateDevice(c *gin.Context) {
	deviceId := c.Param("deviceId")
	
	var updateData struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	query := `
		INSERT INTO devices (id, name, description, last_seen, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, name, description, last_seen, created_at, updated_at
	`
	
	var device Device
	err := db.QueryRow(query, deviceId, updateData.Name, updateData.Description).Scan(
		&device.ID, &device.Name, &device.Description, &device.LastSeen,
		&device.CreatedAt, &device.UpdatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device"})
		return
	}

	c.JSON(http.StatusOK, device)
}

func deleteDevice(c *gin.Context) {
	deviceId := c.Param("deviceId")
	
	query := `DELETE FROM devices WHERE id = $1`
	
	result, err := db.Exec(query, deviceId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete device"})
		return
	}
	
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device deleted successfully"})
}

// Analytics Endpoints
func getAnalyticsSummary(c *gin.Context) {
	query := `
		SELECT 
			COUNT(*) as total_events,
			COUNT(DISTINCT device_id) as active_devices,
			AVG(battery_level) as average_battery,
			MAX(timestamp) as last_event_time,
			SUM(CASE WHEN event_type = 'power_on' THEN 1 ELSE 0 END) as power_on_events,
			SUM(CASE WHEN event_type = 'power_off' THEN 1 ELSE 0 END) as power_off_events
		FROM power_events
		WHERE timestamp >= NOW() - INTERVAL '24 hours'
	`
	
	var summary AnalyticsSummary
	err := db.QueryRow(query).Scan(&summary.TotalEvents, &summary.ActiveDevices,
		&summary.AverageBattery, &summary.LastEventTime, &summary.PowerOnEvents,
		&summary.PowerOffEvents)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics summary"})
		return
	}

	c.JSON(http.StatusOK, summary)
}

func getCalendarData(c *gin.Context) {
	year := c.Param("year")
	month := c.Param("month")
	
	query := `
		SELECT 
			DATE(timestamp) as date,
			COUNT(*) as event_count,
			SUM(CASE WHEN event_type = 'power_on' THEN 1 ELSE 0 END) as power_on_count,
			SUM(CASE WHEN event_type = 'power_off' THEN 1 ELSE 0 END) as power_off_count
		FROM power_events
		WHERE EXTRACT(YEAR FROM timestamp) = $1 AND EXTRACT(MONTH FROM timestamp) = $2
		GROUP BY DATE(timestamp)
		ORDER BY date
	`
	
	rows, err := db.Query(query, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch calendar data"})
		return
	}
	defer rows.Close()

	var events []CalendarEvent
	for rows.Next() {
		var event CalendarEvent
		err := rows.Scan(&event.Date, &event.EventCount, &event.PowerOnCount, &event.PowerOffCount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan calendar event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func getTimeline(c *gin.Context) {
	limit := c.DefaultQuery("limit", "100")
	deviceId := c.Query("device_id")
	
	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		limitInt = 100
	}
	
	var query string
	var args []interface{}
	
	if deviceId != "" {
		query = `
			SELECT id, device_id, event_type, timestamp, battery_level, voltage
			FROM power_events
			WHERE device_id = $1
			ORDER BY timestamp DESC
			LIMIT $2
		`
		args = []interface{}{deviceId, limitInt}
	} else {
		query = `
			SELECT id, device_id, event_type, timestamp, battery_level, voltage
			FROM power_events
			ORDER BY timestamp DESC
			LIMIT $1
		`
		args = []interface{}{limitInt}
	}
	
	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch timeline"})
		return
	}
	defer rows.Close()

	var events []TimelineEvent
	for rows.Next() {
		var event TimelineEvent
		err := rows.Scan(&event.ID, &event.DeviceID, &event.EventType,
			&event.Timestamp, &event.BatteryLevel, &event.Voltage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan timeline event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func getDeviceHealth(c *gin.Context) {
	deviceId := c.Param("deviceId")
	
	query := `
		SELECT 
			device_id,
			MAX(timestamp) as last_seen,
			battery_level,
			voltage,
			COUNT(*) as daily_events
		FROM power_events
		WHERE device_id = $1 AND timestamp >= CURRENT_DATE
		GROUP BY device_id, battery_level, voltage
		ORDER BY last_seen DESC
		LIMIT 1
	`
	
	var health DeviceHealth
	err := db.QueryRow(query, deviceId).Scan(&health.DeviceID, &health.LastSeen,
		&health.LastBatteryLevel, &health.LastVoltage, &health.DailyEvents)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found or no recent data"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device health"})
		return
	}
	
	// Determine health status
	timeSinceLastSeen := time.Since(health.LastSeen)
	if timeSinceLastSeen > 24*time.Hour {
		health.HealthStatus = "offline"
	} else if health.LastBatteryLevel < 20 {
		health.HealthStatus = "low_battery"
	} else if health.LastVoltage < 3.0 {
		health.HealthStatus = "low_voltage"
	} else {
		health.HealthStatus = "healthy"
	}

	c.JSON(http.StatusOK, health)
}