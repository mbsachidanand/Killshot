# Database Setup Guide

## Prerequisites

1. **Install PostgreSQL** on your system:
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from https://www.postgresql.org/download/

2. **Start PostgreSQL service**:
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo systemctl start postgresql`
   - Windows: Start PostgreSQL service from Services

## Database Setup

### 1. Create Database and User

Connect to PostgreSQL as superuser and run:

```sql
-- Create database
CREATE DATABASE expense_manager_db;

-- Create user
CREATE USER expense_manager_user WITH PASSWORD 'expense_manager_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE expense_manager_db TO expense_manager_user;

-- Connect to the database
\c expense_manager_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO expense_manager_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO expense_manager_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO expense_manager_user;
```

### 2. Environment Configuration

Copy the example environment file and update with your database credentials:

```bash
cp env.example .env
```

Update `.env` with your database settings:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_manager_db
DB_USER=expense_manager_user
DB_PASSWORD=expense_manager_password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 3. Run Migrations

```bash
npm run db:migrate
```

### 4. Seed Database

```bash
npm run db:seed
```

### 5. Start Server

```bash
npm run dev
```

## Database Management Commands

- **Run migrations**: `npm run db:migrate`
- **Seed database**: `npm run db:seed`
- **Reset database**: `npm run db:reset`
- **Reset and rebuild**: `npm run db:reset -- --rebuild`

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Ubuntu
   sudo systemctl status postgresql
   ```

2. **Test connection**:
   ```bash
   psql -h localhost -U expense_manager_user -d expense_manager_db
   ```

3. **Check firewall/port**: Ensure port 5432 is open

### Permission Issues

If you get permission errors, run:

```sql
-- Connect as superuser
\c expense_manager_db;

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO expense_manager_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO expense_manager_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO expense_manager_user;
```

### Reset Everything

If you need to start fresh:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS expense_manager_db;"
psql -U postgres -c "CREATE DATABASE expense_manager_db;"

# Run setup again
npm run db:migrate
npm run db:seed
```
