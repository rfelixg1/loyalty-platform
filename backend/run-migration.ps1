$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "loyalty_db"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "rs34rfgrs34rfg"

npx knex migrate:latest 