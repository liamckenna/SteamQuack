package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)




func main() {
	r := mux.NewRouter()
	r.HandleFunc("/api/health", healthHandler).Methods(http.MethodGet)

	//frontend sends backend profile string
	r.HandleFunc("/api/profile/parse", profileParseHandler).Methods(http.MethodPost)
	r.HandleFunc("/api/recommendations", recommendationsHandler).Methods(http.MethodPost)


	log.Println("API server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{
		"ok": true,
	})
}

