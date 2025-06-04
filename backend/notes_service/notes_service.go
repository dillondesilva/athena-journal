package notes_service

import (
	"github.com/google/uuid"
	"fmt"
	"time"
	"database/sql"
)

// Interface for the NotesService
type NotesService interface {
	CreateNote (title string, db *sql.DB) (uuid.UUID, error)
	// UpdateNoteTitle (Note newNote) (error)
	// DeleteNote (uuid.UUID id) (error)
	// GetNote (uuid.UUID id) (Note, error)
}

type NotesServiceImpl struct {}

// Implementation of the NotesService methods
func (notesService *NotesServiceImpl) CreateNote (title string, db *sql.DB) (uuid.UUID, error) {
	tx, err := db.Begin()
	if err != nil {
		return uuid.Nil, err
	}
	newNoteId := uuid.New()
	noteContent := "Some random content"
	sqlStatement := "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
	fmt.Println(sqlStatement)
	stmt, err := tx.Prepare(sqlStatement)
	if err != nil {
		fmt.Printf("Error preparing statement: %v\n", err)
		return uuid.Nil, err
	}
	_, err = stmt.Exec(newNoteId, title, noteContent, time.Now(), time.Now())
	if err != nil {
		fmt.Printf("Error executing statement: %v\n", err)
		return uuid.Nil, err
	}
	err = tx.Commit()
	if err != nil {
		fmt.Printf("Error committing transaction: %v\n", err)
		return uuid.Nil, err
	}
	return newNoteId, nil
}

