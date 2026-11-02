package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Todo struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Date        string    `json:"date"`
	StartTime   string    `json:"start_time"`
	EndTime     string    `json:"end_time"`
	Done        bool      `json:"done"`
	Workspace   string    `json:"workspace"`
	CreatedAt   time.Time `json:"created_at"`
}

const cols = `id, title, description, category, to_char(date,'YYYY-MM-DD'), start_time, end_time, done, workspace, created_at`

func scan(row interface{ Scan(...any) error }, t *Todo) error {
	return row.Scan(&t.ID, &t.Title, &t.Description, &t.Category, &t.Date, &t.StartTime, &t.EndTime, &t.Done, &t.Workspace, &t.CreatedAt)
}

var db *pgxpool.Pool

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func getWorkspace(r *http.Request) string {
	ws := strings.TrimSpace(r.Header.Get("x-workspace"))
	if ws == "" {
		ws = strings.TrimSpace(r.URL.Query().Get("workspace"))
	}
	if ws == "" {
		ws = "default"
	}
	return strings.ToLower(ws)
}

func main() {
	dsn := env("DATABASE_URL", "postgres://postgres:postgres@localhost:5440/todo?sslmode=disable")
	ctx := context.Background()
	var err error
	db, err = pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal(err)
	}
	if err = db.Ping(ctx); err != nil {
		log.Fatal("tidak bisa konek ke database: ", err)
	}
	_, err = db.Exec(ctx, `CREATE TABLE IF NOT EXISTS todos (
		id SERIAL PRIMARY KEY,
		title TEXT NOT NULL,
		done BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
	if err != nil {
		log.Fatal(err)
	}
	for _, q := range []string{
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Idea'`,
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE`,
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS start_time TEXT NOT NULL DEFAULT '09:00'`,
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS end_time TEXT NOT NULL DEFAULT '10:00'`,
		`ALTER TABLE todos ADD COLUMN IF NOT EXISTS workspace TEXT NOT NULL DEFAULT 'default'`,
		`CREATE INDEX IF NOT EXISTS idx_todos_workspace ON todos (workspace)`,
	} {
		if _, err = db.Exec(ctx, q); err != nil {
			log.Fatal(err)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/todos", listTodos)
	mux.HandleFunc("POST /api/todos", createTodo)
	mux.HandleFunc("PUT /api/todos/{id}", updateTodo)
	mux.HandleFunc("DELETE /api/todos/{id}", deleteTodo)

	addr := ":" + env("PORT", "8080")
	log.Println("server berjalan di", addr)
	log.Fatal(http.ListenAndServe(addr, cors(mux)))
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", env("CORS_ORIGIN", "*"))
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, x-workspace")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func listTodos(w http.ResponseWriter, r *http.Request) {
	ws := getWorkspace(r)
	rows, err := db.Query(r.Context(), `SELECT `+cols+` FROM todos WHERE workspace = $1 ORDER BY date, start_time, id`, ws)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	todos := []Todo{}
	for rows.Next() {
		var t Todo
		if err := scan(rows, &t); err != nil {
			fail(w, 500, err.Error())
			return
		}
		todos = append(todos, t)
	}
	writeJSON(w, 200, todos)
}

func createTodo(w http.ResponseWriter, r *http.Request) {
	ws := getWorkspace(r)
	var in struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Date        string `json:"date"`
		StartTime   string `json:"start_time"`
		EndTime     string `json:"end_time"`
		Workspace   string `json:"workspace"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Title == "" {
		fail(w, 400, "title wajib diisi")
		return
	}
	if in.Workspace != "" {
		ws = strings.ToLower(strings.TrimSpace(in.Workspace))
	}
	if in.Category == "" {
		in.Category = "Idea"
	}
	if in.Date == "" {
		in.Date = time.Now().Format("2006-01-02")
	}
	if in.StartTime == "" {
		in.StartTime = "09:00"
	}
	if in.EndTime == "" {
		in.EndTime = "10:00"
	}
	var t Todo
	err := scan(db.QueryRow(r.Context(),
		`INSERT INTO todos (title, description, category, date, start_time, end_time, workspace)
		 VALUES ($1,$2,$3,$4::date,$5,$6,$7) RETURNING `+cols,
		in.Title, in.Description, in.Category, in.Date, in.StartTime, in.EndTime, ws), &t)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 201, t)
}

func updateTodo(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		fail(w, 400, "id tidak valid")
		return
	}
	ws := getWorkspace(r)
	var in struct {
		Title *string `json:"title"`
		Done  *bool   `json:"done"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		fail(w, 400, "body tidak valid")
		return
	}
	var t Todo
	err = scan(db.QueryRow(r.Context(),
		`UPDATE todos SET title = COALESCE($2, title), done = COALESCE($3, done)
		 WHERE id = $1 AND workspace = $4 RETURNING `+cols, id, in.Title, in.Done, ws), &t)
	if err != nil {
		fail(w, 404, "todo tidak ditemukan")
		return
	}
	writeJSON(w, 200, t)
}

func deleteTodo(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		fail(w, 400, "id tidak valid")
		return
	}
	ws := getWorkspace(r)
	if _, err := db.Exec(r.Context(), `DELETE FROM todos WHERE id = $1 AND workspace = $2`, id, ws); err != nil {
		fail(w, 500, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
