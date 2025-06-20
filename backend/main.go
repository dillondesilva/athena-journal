package main

import (
	"backend/lm_service"
	"backend/notes_service"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

// CORS middleware function
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins, or specify your frontend URL
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next(w, r)
	}
}

func InitialiseDBClient(dbName string) (*sql.DB, error) {
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

func createNote(w http.ResponseWriter, _ *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	newNote, err := notesService.CreateNote("Untitled Note", db)
	if err != nil {
		fmt.Fprintln(w, "Error creating note: ", err)
		return
	}
	err = json.NewEncoder(w).Encode(newNote)
	if err != nil {
		fmt.Fprintln(w, "Error encoding note: ", err)
		return
	}
	log.Println("Note created: ", newNote.NoteId)
}

func getAllNotes(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	log.Println("/getallnotes request received")
	notes, err := notesService.GetAllNotes(db)
	if err != nil {
		fmt.Fprintln(w, "Error getting notes: ", err)
		return
	}

	if err := json.NewEncoder(w).Encode(notes); err != nil {
		fmt.Fprintln(w, "Error encoding notes: ", err)
		return
	}

	for _, note := range notes {
		fmt.Println("New note: ", note.NoteId, note.Title, note.Content, note.CreatedAt, note.UpdatedAt)
	}
}

type GetNoteRequest struct {
	NoteId string `json:"NoteId"`
}

func getNote(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	log.Println("/getnote request received")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintln(w, "Error reading request body: ", err)
		return
	}
	noteRequest := GetNoteRequest{}
	err = json.Unmarshal(body, &noteRequest)
	if err != nil {
		fmt.Fprintln(w, "Error unmarshalling request body: ", err)
		return
	}
	log.Println("Note ID: ", noteRequest.NoteId)
	note, err := notesService.GetNote(uuid.MustParse(noteRequest.NoteId), db)
	if err != nil {
		fmt.Fprintln(w, "Error getting note: ", err)
		return
	}
	err = json.NewEncoder(w).Encode(note)
	if err != nil {
		fmt.Fprintln(w, "Error encoding note: ", err)
		return
	}
}

func updateNote(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintln(w, "Error reading request body: ", err)
		return
	}
	updateNoteRequest := notes_service.UpdateNoteRequestDto{}
	err = json.Unmarshal(body, &updateNoteRequest)
	if err != nil {
		fmt.Fprintln(w, "Error unmarshalling request body: ", err)
		return
	}

	note := notes_service.Note{
		NoteId:    uuid.MustParse(updateNoteRequest.NoteId),
		Title:     updateNoteRequest.Title,
		Content:   updateNoteRequest.Content,
		CreatedAt: updateNoteRequest.CreatedAt,
		UpdatedAt: updateNoteRequest.UpdatedAt,
	}
	err = notesService.UpdateNote(note, db)
	if err != nil {
		fmt.Fprintln(w, "Error updating note: ", err)
		return
	}
	log.Println("Note updated: ", note.NoteId)
}

func chatStream(w http.ResponseWriter, r *http.Request, chatService *lm_service.ChatServiceImpl) {
	// Set headers for streaming
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintln(w, "Error reading request body: ", err)
		return
	}
	chatRequestDto := lm_service.ChatRequestDto{}
	err = json.Unmarshal(body, &chatRequestDto)
	if err != nil {
		fmt.Fprintln(w, "Error unmarshalling request body: ", err)
		return
	}
	chatService.ChatStream(chatRequestDto.Prompt, func(chunk string) {
		w.Write([]byte(chunk))
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
	})
}

type ClarityRequest struct {
	Timeframe string `json:"timeframe"`
}

type ClarityResponse struct {
	Summary string `json:"summary"`
}

func clarityStreamHandler(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, chatService *lm_service.ChatServiceImpl, db *sql.DB) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	var req ClarityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	var duration time.Duration
	switch req.Timeframe {
	case "week":
		duration = 7 * 24 * time.Hour
	case "month":
		duration = 30 * 24 * time.Hour
	case "6months":
		duration = 180 * 24 * time.Hour
	default:
		http.Error(w, "Invalid timeframe", http.StatusBadRequest)
		return
	}
	notes, err := notesService.GetNotesWithinTimeframe(db, duration)
	if err != nil {
		http.Error(w, "Failed to get notes", http.StatusInternalServerError)
		return
	}
	var noteContents []string
	for _, note := range notes {
		noteContents = append(noteContents, note.Content)
	}
	err = chatService.GetClaritySummaryStream(noteContents, func(chunk string) {
		w.Write([]byte(chunk))
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
	})
	if err != nil {
		http.Error(w, "Failed to get clarity", http.StatusInternalServerError)
		return
	}
}

func deleteNote(w http.ResponseWriter, r *http.Request, notesService *notes_service.NotesServiceImpl, db *sql.DB) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintln(w, "Error reading request body: ", err)
		return
	}

	noteRequest := GetNoteRequest{}
	err = json.Unmarshal(body, &noteRequest)
	if err != nil {
		fmt.Fprintln(w, "Error unmarshalling request body: ", err)
		return
	}

	err = notesService.DeleteNote(uuid.MustParse(noteRequest.NoteId), db)
	if err != nil {
		fmt.Fprintln(w, "Error deleting note: ", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func main() {
	// Initialising the database
	db, _ := InitialiseDBClient("notes.db")
	err := db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	db.Exec("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, created_at DATETIME, updated_at DATETIME)")

	notesService := notes_service.NotesServiceImpl{}
	log.Println("Initialising chat service")
	chatService := lm_service.ChatServiceImpl{
		UseHf:  true,
		Status: false,
		Model:  "ggml-org/gemma-3-1b-it-GGUF",
	}
	chatService.InitialiseChat()

	// Initialising the server with CORS enabled
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/createnote", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		createNote(w, r, &notesService, db)
	}))
	http.HandleFunc("/updatenote", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		updateNote(w, r, &notesService, db)
	}))
	http.HandleFunc("/getallnotes", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		getAllNotes(w, r, &notesService, db)
	}))

	http.HandleFunc("/getnote", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		getNote(w, r, &notesService, db)
	}))

	http.HandleFunc("/chat", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		log.Println("/chat request received")
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		chatStream(w, r, &chatService)
	}))

	http.HandleFunc("/clarity", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		clarityStreamHandler(w, r, &notesService, &chatService, db)
	}))

	http.HandleFunc("/deletenote", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		deleteNote(w, r, &notesService, db)
	}))

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
