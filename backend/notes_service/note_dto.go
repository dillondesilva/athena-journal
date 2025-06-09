package notes_service

import "time"

type UpdateNoteRequestDto struct {
	NoteId    string    `json:"NoteId"`
	Title     string    `json:"Title"`
	Content   string    `json:"Content"`
	UpdatedAt time.Time `json:"UpdatedAt"`
	CreatedAt time.Time `json:"CreatedAt"`
}
