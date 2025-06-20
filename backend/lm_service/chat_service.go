/*
In here, we have our chat service. This can be used to route requests to
llama.cpp and will also run health polling as a coroutine. In here,
we have methods for initialising, running a chat completions (including streaming),
and getting the status of the chat service to see if it is available.
*/
package lm_service

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"time"
)

type ChatService interface {
	InitialiseChat(model string) error
	BeginHealthCheck() error
	Chat(sequence string) (string, error)
	ChatStream(sequence string, callback func(chunk string)) error
	GetStatus() bool
	GetClaritySummary(notes []string) (string, error)
	GetClaritySummaryStream(notes []string, callback func(chunk string)) error
}

type ChatServiceImpl struct {
	Model  string
	UseHf  bool
	Status bool
}

func (chatService *ChatServiceImpl) BeginHealthCheck() error {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		// Send a request to llama.cpp in here
		log.Println("Checking health of llama-server")
		resp, err := http.Get("http://127.0.0.1:8029/health")

		if resp.StatusCode != 200 {
			log.Println("Llama-server health check FAIL")
			log.Println(err)
			chatService.Status = false
		} else {
			log.Println("Llama-server health check SUCCESS")
			chatService.Status = true
		}
	}

	return nil
}

func (chatService *ChatServiceImpl) InitialiseChat() error {
	// For now, we're spawning llama.cpp as if it existed on
	// the system and no prebuilt binaries are included.
	if chatService.UseHf {
		cmd := exec.Command("llama-server", "-hf", chatService.Model, "--port", "8029")
		err := cmd.Start()
		if err != nil {
			log.Println("Error starting llama-server")
			log.Println(err)
			return err
		}

		go chatService.BeginHealthCheck()
	} else {
		chatService.Model = "llama3.1-8b-instant"
	}

	return nil
}

func CreateClaritySequence(prompt string) string {
	return fmt.Sprintf("<start_of_turn>user\nYou are a thoughtful and supportive assistant designed to bring clarity and insight to my journal entries. I will provide a series of personal reflections, and your task is to synthesize them into a single, meaningful response.\n\nYour response should:\n- Highlight recurring themes or emotional patterns in my journal entries\n- Offer constructive, empathetic advice where appropriate\n- Point out signs of personal growth or reflection\n- Suggest thoughtful next steps or perspectives to consider\n\nRefer to the input as \"your journal entries\" rather than \"the text.\"\nYou are not in a conversation, so DO NOT ask follow-up questions or request additional information. Respond in a calm, polite, and respectful tone. Use plain text only — no markdown formatting.\n\nHere are the journal entries to analyze:\n%s\n<end_of_turn>\n<start_of_turn>assistant\n", prompt)
}

func CreateIndividualEntrySequence(prompt string) string {
	return fmt.Sprintf("<start_of_turn>user\nYou are a thoughtful and supportive assistant designed to help me gain deeper insights from my individual journal entries. I will provide a single personal reflection, and your task is to help me explore and understand it more deeply.\n\nYour response should:\n- Help me identify the underlying emotions and thoughts in this entry\n- Point out any patterns or themes that emerge from this reflection\n- Offer gentle, constructive perspectives that might help me see things differently\n- Suggest questions I could ask myself to explore this topic further\n- Highlight any signs of self-awareness or growth in this entry\n\nRefer to the input as \"your journal entry\" rather than \"the text.\"\nYou are not in a conversation, so DO NOT ask follow-up questions or request additional information. Respond in a calm, polite, and respectful tone. Use plain text only — no markdown formatting.\n\nHere is the journal entry to reflect on:\n%s\n<end_of_turn>\n<start_of_turn>assistant\n", prompt)
}

func (chatService *ChatServiceImpl) ChatStream(sequence string, callback func(chunk string)) error {
	// Determine if this is a single entry or multiple entries by checking for newlines
	// If there are multiple newlines, it's likely multiple entries, otherwise treat as single
	isMultipleEntries := false
	newlineCount := 0
	for _, char := range sequence {
		if char == '\n' {
			newlineCount++
			if newlineCount > 3 { // Threshold to determine if it's multiple entries
				isMultipleEntries = true
				break
			}
		}
	}

	var prompt string
	if isMultipleEntries {
		prompt = CreateClaritySequence(sequence)
	} else {
		prompt = CreateIndividualEntrySequence(sequence)
	}

	chatRequestDto := ChatRequestDto{
		Prompt:         prompt,
		N_predict:      512,
		Stream:         true,
		Temperature:    1.0,
		Top_k:          64,
		Top_p:          0.95,
		Repeat_penalty: 1.0,
	}

	jsonData, err := json.Marshal(chatRequestDto)
	if err != nil {
		log.Println("Error marshalling chat request")
		log.Println(err)
		return err
	}

	log.Println("Sending chat request to llama-server")
	log.Println(string(jsonData))
	resp, err := http.Post("http://127.0.0.1:8029/completions", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("Error sending chat request to llama-server")
		log.Println(err)
		return err
	}
	defer resp.Body.Close()

	// Read the response as a stream
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		chunk := scanner.Text()
		if chunk != "" {
			log.Println("Received chunk: ", chunk)
			callback(chunk)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Println("Error reading streaming response")
		log.Println(err)
		return err
	}

	return nil
}

func (chatService *ChatServiceImpl) GetStatus() bool {
	return chatService.Status
}

func (chatService *ChatServiceImpl) GetClaritySummary(notes []string) (string, error) {
	joinedNotes := ""
	for _, note := range notes {
		joinedNotes += note + "\n"
	}
	prompt := CreateClaritySequence(joinedNotes)
	chatRequestDto := ChatRequestDto{
		Prompt:         prompt,
		N_predict:      512,
		Stream:         true,
		Temperature:    1.0,
		Top_k:          64,
		Top_p:          0.95,
		Repeat_penalty: 1.0,
	}
	jsonData, err := json.Marshal(chatRequestDto)
	if err != nil {
		return "", err
	}
	resp, err := http.Post("http://127.0.0.1:8029/completions", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Content, nil
}

func (chatService *ChatServiceImpl) GetClaritySummaryStream(notes []string, callback func(chunk string)) error {
	joinedNotes := ""
	for _, note := range notes {
		joinedNotes += note + "\n"
	}
	prompt := CreateClaritySequence(joinedNotes)
	chatRequestDto := ChatRequestDto{
		Prompt:         prompt,
		N_predict:      512,
		Stream:         true,
		Temperature:    1.0,
		Top_k:          64,
		Top_p:          0.95,
		Repeat_penalty: 1.0,
	}
	jsonData, err := json.Marshal(chatRequestDto)
	if err != nil {
		return err
	}
	resp, err := http.Post("http://127.0.0.1:8029/completions", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		chunk := scanner.Text()
		if chunk != "" {
			callback(chunk)
		}
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	return nil
}
