package main
import (
	"database/sql"
	"net/http"
	"fmt"
	"log"
	_ "github.com/mattn/go-sqlite3"
	"backend/notes_service"
)

func InitialiseDBClient (dbName string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dbName)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	return db, nil
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello, World!")
}

func createNote(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	notesService.CreateNote("Untitled Note", db)
}

func main() {
	// Initialising the database
	db, _ := InitialiseDBClient("notes.db")
	err := db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	db.Exec("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, created_at TEXT, updated_at TEXT)")

	notesService := notes_service.NotesServiceImpl{}

	// Initialising the server
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/createnote", func(w http.ResponseWriter, r *http.Request) {
		createNote(w, r, &notesService, db)
	})
	http.ListenAndServe(":8080", nil)
}
