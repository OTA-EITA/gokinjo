package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"

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

type SafetyScore struct {
	SchoolID     int     `json:"school_id"`
	SchoolName   string  `json:"school_name"`
	Score        float64 `json:"score"`         // 0-100のスコア（高いほど安全）
	CrimeCount   int     `json:"crime_count"`   // 半径500m以内の犯罪件数
	Radius       int     `json:"radius_meters"` // 調査半径（メートル）
	LastUpdated  string  `json:"last_updated"`
	ScoreLevel   string  `json:"score_level"`   // "very_safe", "safe", "moderate", "caution"
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
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": "2025-08-24",
		"version":   "1.1.0",
		"features": []string{
			"areas", "schools", "crimes", "safety_score",
		},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) areasHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query("SELECT id, ward_code, town_code, name FROM areas ORDER BY ward_code, town_code")
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
		ORDER BY s.name
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

// 新機能: 犯罪データエンドポイント
func (s *Server) crimesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	wardCode := vars["ward_code"]
	townCode := vars["town_code"]

	query := `
		SELECT c.id, c.category, c.date::text,
		       ST_Y(c.location) as latitude,
		       ST_X(c.location) as longitude,
		       c.description, c.area_id
		FROM crimes c
		JOIN areas a ON c.area_id = a.id
		WHERE a.ward_code = $1 AND a.town_code = $2
		ORDER BY c.date DESC
	`

	rows, err := s.db.Query(query, wardCode, townCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var crimes []Crime
	for rows.Next() {
		var crime Crime
		err := rows.Scan(
			&crime.ID, &crime.Category, &crime.Date,
			&crime.Latitude, &crime.Longitude, &crime.Description, &crime.AreaID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		crimes = append(crimes, crime)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"crimes":      crimes,
		"total_count": len(crimes),
	})
}

// 新機能: 学校の安全性スコア計算
func (s *Server) safetyScoreHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	schoolIDStr := vars["id"]
	schoolID, err := strconv.Atoi(schoolIDStr)
	if err != nil {
		http.Error(w, "Invalid school ID", http.StatusBadRequest)
		return
	}

	// 学校情報を取得
	var school School
	schoolQuery := `
		SELECT id, name, type, public_private,
		       ST_Y(location) as latitude,
		       ST_X(location) as longitude,
		       address, area_id
		FROM schools WHERE id = $1
	`
	err = s.db.QueryRow(schoolQuery, schoolID).Scan(
		&school.ID, &school.Name, &school.Type, &school.PublicPrivate,
		&school.Latitude, &school.Longitude, &school.Address, &school.AreaID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "School not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 半径500m以内の犯罪件数を計算
	const radiusMeters = 500
	crimeCountQuery := `
		SELECT COUNT(*)
		FROM crimes c
		WHERE ST_DWithin(
			c.location,
			ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326)::geography,
			$3
		)
	`
	
	var crimeCount int
	err = s.db.QueryRow(crimeCountQuery, school.Longitude, school.Latitude, radiusMeters).Scan(&crimeCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 安全性スコア計算 (0-100)
	// 犯罪件数が少ないほど高スコア
	// 0件=100点, 1件=90点, 2件=80点, ... 10件以上=0点
	score := math.Max(0, 100-float64(crimeCount)*10)
	
	// スコアレベル判定
	var scoreLevel string
	switch {
	case score >= 90:
		scoreLevel = "very_safe"
	case score >= 70:
		scoreLevel = "safe" 
	case score >= 50:
		scoreLevel = "moderate"
	default:
		scoreLevel = "caution"
	}

	safetyScore := SafetyScore{
		SchoolID:     schoolID,
		SchoolName:   school.Name,
		Score:        score,
		CrimeCount:   crimeCount,
		Radius:       radiusMeters,
		LastUpdated:  "2025-08-24", // 実際は現在時刻を使用
		ScoreLevel:   scoreLevel,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(safetyScore)
}

// 新機能: 全学校の安全性スコア一覧
func (s *Server) safetyScoresHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	wardCode := vars["ward_code"]
	townCode := vars["town_code"]

	// 指定エリアの全学校を取得
	schoolQuery := `
		SELECT s.id, s.name, s.type, s.public_private,
		       ST_Y(s.location) as latitude,
		       ST_X(s.location) as longitude,
		       s.address, s.area_id
		FROM schools s
		JOIN areas a ON s.area_id = a.id
		WHERE a.ward_code = $1 AND a.town_code = $2
		ORDER BY s.name
	`

	rows, err := s.db.Query(schoolQuery, wardCode, townCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var safetyScores []SafetyScore
	const radiusMeters = 500

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

		// 各学校の犯罪件数を計算
		crimeCountQuery := `
			SELECT COUNT(*)
			FROM crimes c
			WHERE ST_DWithin(
				c.location,
				ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326)::geography,
				$3
			)
		`
		
		var crimeCount int
		err = s.db.QueryRow(crimeCountQuery, school.Longitude, school.Latitude, radiusMeters).Scan(&crimeCount)
		if err != nil {
			log.Printf("Error calculating crime count for school %d: %v", school.ID, err)
			crimeCount = 0
		}

		// 安全性スコア計算
		score := math.Max(0, 100-float64(crimeCount)*10)
		
		var scoreLevel string
		switch {
		case score >= 90:
			scoreLevel = "very_safe"
		case score >= 70:
			scoreLevel = "safe"
		case score >= 50:
			scoreLevel = "moderate"
		default:
			scoreLevel = "caution"
		}

		safetyScore := SafetyScore{
			SchoolID:     school.ID,
			SchoolName:   school.Name,
			Score:        score,
			CrimeCount:   crimeCount,
			Radius:       radiusMeters,
			LastUpdated:  "2025-08-24",
			ScoreLevel:   scoreLevel,
		}

		safetyScores = append(safetyScores, safetyScore)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"safety_scores": safetyScores,
		"total_count":   len(safetyScores),
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
	
	// 既存エンドポイント
	r.HandleFunc("/health", server.healthHandler)
	r.HandleFunc("/v1/areas", server.areasHandler)
	r.HandleFunc("/v1/areas/{ward_code}/{town_code}/schools", server.schoolsHandler)
	
	// 新規エンドポイント
	r.HandleFunc("/v1/areas/{ward_code}/{town_code}/crimes", server.crimesHandler)
	r.HandleFunc("/v1/schools/{id}/safety-score", server.safetyScoreHandler)
	r.HandleFunc("/v1/areas/{ward_code}/{town_code}/safety-scores", server.safetyScoresHandler)

	log.Println("🚀 Enhanced HTTP server listening on :8081")
	log.Println("📍 New endpoints:")
	log.Println("   GET /v1/areas/{ward_code}/{town_code}/crimes")
	log.Println("   GET /v1/schools/{id}/safety-score") 
	log.Println("   GET /v1/areas/{ward_code}/{town_code}/safety-scores")
	
	log.Fatal(http.ListenAndServe(":8081", r))
}