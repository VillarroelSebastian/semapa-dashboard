package main

import (
	"log"
	"semapa/backend/database"
	"semapa/backend/routes"
)

func main() {
	// Initialize Cassandra connection
	database.InitCassandra()
	defer database.Close()

	// Setup Router
	r := routes.SetupRouter()

	// Start server
	log.Println("Backend started at :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
