package db_client

import "database/sql"

type DBClient struct {
	db *sql.DB
}
