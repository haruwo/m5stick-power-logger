package db

import (
    "database/sql"
    "fmt"
    "os"
    "time"

    _ "github.com/lib/pq"
)

func Connect() (*sql.DB, error) {
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbUser := os.Getenv("DB_USER")
    dbPassword := os.Getenv("DB_PASSWORD")
    dbName := os.Getenv("DB_NAME")

    psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        dbHost, dbPort, dbUser, dbPassword, dbName)

    var db *sql.DB
    var err error

    // リトライロジック
    for i := 0; i < 10; i++ {
        db, err = sql.Open("postgres", psqlInfo)
        if err == nil {
            err = db.Ping()
            if err == nil {
                break
            }
        }
        time.Sleep(3 * time.Second)
    }

    return db, err
}