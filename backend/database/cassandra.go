package database

import (
	"log"

	"github.com/gocql/gocql"
)

var Session *gocql.Session

func InitCassandra() {
	cluster := gocql.NewCluster("cassandra-1", "cassandra-2")
	// If running outside Docker, it might be 127.0.0.1. But we are dockerizing it.
	cluster.Keyspace = "semapa"
	cluster.Consistency = gocql.One
	var err error
	Session, err = cluster.CreateSession()
	if err != nil {
		log.Fatalf("Error connecting to Cassandra: %v", err)
	}
	log.Println("Connected to Cassandra")
}

func Close() {
	if Session != nil {
		Session.Close()
	}
}
