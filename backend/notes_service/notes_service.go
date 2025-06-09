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
	// DeleteNote(uuid.UUID id) (error)
}

type NotesServiceImpl struct{}

// Implementation of the NotesService methods
func (notesService *NotesServiceImpl) CreateNote(title string, db *sql.DB) (Note, error) {
	tx, err := db.Begin()
	newNote := Note{
		NoteId:    uuid.New(),
		Title:     title,
		Content:   "",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err != nil {
		return newNote, err
	}
	newNoteId := uuid.New()
	noteContent := ""
	sqlStatement := "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
	fmt.Println(sqlStatement)
	stmt, err := tx.Prepare(sqlStatement)
	if err != nil {
		fmt.Printf("Error preparing statement: %v\n", err)
		return newNote, err
	}
	_, err = stmt.Exec(newNoteId, title, noteContent, time.Now(), time.Now())
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return newNote, err
	}
	err = tx.Commit()
	if err != nil {
		fmt.Printf("Error committing transaction: %v\n", err)
		return newNote, err
	}
	return newNote, nil
}

func (notesService *NotesServiceImpl) GetNote(id uuid.UUID, db *sql.DB) (Note, error) {
	sqlStatement := "SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?"
	sql_result, err := db.Query(sqlStatement, id)
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return Note{}, err
	}
	defer sql_result.Close()

	var note Note
	sql_result.Next()
	err = sql_result.Scan(&note.NoteId, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		fmt.Printf("Error scanning row: %v\n", err)
		return Note{}, err
	}
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
