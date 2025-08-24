package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type Area struct {
	ID       int    `json:"id"`
	WardCode string `json:"ward_code"`
	TownCode string `json:"town_code"`
	Name     string `json:"name"`
}

type School struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Type          string  `json:"type"`
	PublicPrivate string  `json:"public_private"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Address       string  `json:"address"`
	AreaID        int     `json:"area_id"`
}

type Crime struct {
	ID          int     `json:"id"`
	Category    string  `json:"category"`
	Date        string  `json:"date"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Description string  `json:"description"`
	AreaID      int     `json:"area_id"`
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type Server struct {
	db *sql.DB
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"status":    "healthy",
		"timestamp": "2025-08-24",
		"version":   "1.0.0",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) areasHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query("SELECT id, ward_code, town_code, name FROM areas")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var areas []Area
	for rows.Next() {
		var area Area
		err := rows.Scan(&area.ID, &area.WardCode, &area.TownCode, &area.Name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		areas = append(areas, area)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"areas":       areas,
		"total_count": len(areas),
	})
}

func (s *Server) schoolsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	wardCode := vars["ward_code"]
	townCode := vars["town_code"]

	query := `
		SELECT s.id, s.name, s.type, s.public_private,
		       ST_Y(s.location) as latitude,
		       ST_X(s.location) as longitude,
		       s.address, s.area_id
		FROM schools s
		JOIN areas a ON s.area_id = a.id
		WHERE a.ward_code = $1 AND a.town_code = $2
	`

	rows, err := s.db.Query(query, wardCode, townCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var schools []School
	for rows.Next() {
		var school School
		err := rows.Scan(
			&school.ID, &school.Name, &school.Type, &school.PublicPrivate,
			&school.Latitude, &school.Longitude, &school.Address, &school.AreaID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		schools = append(schools, school)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"schools":     schools,
		"total_count": len(schools),
	})
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/neighborhood_mapping?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	server := &Server{db: db}

	r := mux.NewRouter()
	r.Use(corsMiddleware)
	r.HandleFunc("/health", server.healthHandler)
	r.HandleFunc("/v1/areas", server.areasHandler)
	r.HandleFunc("/v1/areas/{ward_code}/{town_code}/schools", server.schoolsHandler)

	log.Println("HTTP server listening on :8081")
	log.Fatal(http.ListenAndServe(":8081", r))
}
