package lm_service

type ChatRequestDto struct {
	Prompt         string  `json:"prompt"`
	N_predict      int     `json:"n_predict"`
	Stream         bool    `json:"stream"`
	Temperature    float64 `json:"temperature"`
	Top_k          int     `json:"top_k"`
	Top_p          float64 `json:"top_p"`
	Repeat_penalty float64 `json:"repeat_penalty"`
}
