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
		if err != nil {
			log.Println("Error checking health of llama-server")
			log.Println(err)
			chatService.Status = false
			return err
		}

		if resp.StatusCode != 200 {
			log.Println("Llama-server health check FAIL")
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
	return fmt.Sprintf("<start_of_turn>user\nYou are a helpful assistant that can help me clarify my thoughts. I will give you a prompt and you will need to clarify it. The prompt is: %s<end_of_turn>\n<start_of_turn>assistant\n", prompt)
}

func (chatService *ChatServiceImpl) ChatStream(sequence string, callback func(chunk string)) error {
	chatRequestDto := ChatRequestDto{
		Prompt:         CreateClaritySequence(sequence),
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
