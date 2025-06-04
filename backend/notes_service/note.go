package notes_service

import (
	"time"
	"github.com/google/uuid"
)

type Note struct {
	NoteId uuid.UUID
	Title string
	Content string
	CreatedAt time.Time
	UpdatedAt time.Time
}