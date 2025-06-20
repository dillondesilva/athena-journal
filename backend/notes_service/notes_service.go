package notes_service

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Interface for the NotesService
type NotesService interface {
	CreateNote(title string, db *sql.DB) (Note, error)
	GetAllNotes(id uuid.UUID, db *sql.DB) ([]Note, error)
	GetNote(id uuid.UUID, db *sql.DB) (Note, error)
	UpdateNote(note Note, db *sql.DB) error
	GetNotesWithinTimeframe(db *sql.DB, duration time.Duration) ([]Note, error)
	DeleteNote(id uuid.UUID, db *sql.DB) error
}

type NotesServiceImpl struct{}

// Implementation of the NotesService methods
func (notesService *NotesServiceImpl) CreateNote(title string, db *sql.DB) (Note, error) {
	newNote := Note{
		NoteId:    uuid.New(),
		Title:     title,
		Content:   "",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	sqlStatement := "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
	fmt.Println(sqlStatement)
	_, err := db.Exec(sqlStatement, newNote.NoteId, title, "", time.Now(), time.Now())
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return newNote, err
	}

	// Verify the note exists and is queryable
	verifyNote, err := notesService.GetNote(newNote.NoteId, db)
	if err != nil {
		return newNote, fmt.Errorf("note was inserted but could not be verified: %v", err)
	}
	return verifyNote, nil
}

func (notesService *NotesServiceImpl) GetNote(id uuid.UUID, db *sql.DB) (Note, error) {
	sqlStatement := "SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?"
	sql_result, err := db.Query(sqlStatement, id)
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return Note{}, err
	}

	var note Note
	if !sql_result.Next() {
		sql_result.Close()
		return Note{}, fmt.Errorf("no note found with id: %v", id)
	}

	err = sql_result.Scan(&note.NoteId, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		sql_result.Close()
		fmt.Printf("Error scanning row: %v\n", err)
		return Note{}, err
	}

	sql_result.Close()
	return note, nil
}

func (notesService *NotesServiceImpl) GetAllNotes(db *sql.DB) ([]Note, error) {
	sqlStatement := "SELECT id, title, content, created_at, updated_at FROM notes"
	sql_result, err := db.Query(sqlStatement)
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return nil, err
	}

	notes := []Note{}

	for sql_result.Next() {
		var note Note
		err = sql_result.Scan(&note.NoteId, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt)
		if err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

func (notesService *NotesServiceImpl) UpdateNote(note Note, db *sql.DB) error {
	sqlStatement := "UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?"
	_, err := db.Exec(sqlStatement, note.Title, note.Content, time.Now(), note.NoteId)
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return err
	}
	return nil
}

func (notesService *NotesServiceImpl) GetNotesWithinTimeframe(db *sql.DB, duration time.Duration) ([]Note, error) {
	cutoff := time.Now().Add(-duration)
	sqlStatement := "SELECT id, title, content, created_at, updated_at FROM notes WHERE created_at >= ?"
	sql_result, err := db.Query(sqlStatement, cutoff)
	if err != nil {
		return nil, err
	}
	defer sql_result.Close()

	notes := []Note{}
	for sql_result.Next() {
		var note Note
		err = sql_result.Scan(&note.NoteId, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}
	return notes, nil
}

func (notesService *NotesServiceImpl) DeleteNote(id uuid.UUID, db *sql.DB) error {
	sqlStatement := "DELETE FROM notes WHERE id = ?"
	_, err := db.Exec(sqlStatement, id)
	if err != nil {
		fmt.Printf("Error executing delete statement: %v\n", err)
		return err
	}
	return nil
}
