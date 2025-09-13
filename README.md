# Killshot - Expense Manager

A modern expense splitting app built with SwiftUI and Node.js, designed to help groups track and split expenses efficiently.

## Features

- **Group Management**: Create and manage expense groups with multiple members
- **Expense Tracking**: Add expenses with detailed information and automatic splitting
- **Real-time Updates**: Live synchronization between iOS app and backend
- **User-friendly Interface**: Clean, intuitive design with validation and error handling
- **Cross-platform**: iOS app with RESTful API backend

## Architecture

### iOS App (SwiftUI)
- **ContentView**: Main screen with groups list and navigation
- **GroupDetailView**: Individual group details and expense history
- **AddExpenseView**: Modal form for creating new expenses
- **Services**: API communication and data management
- **Models**: Data structures for groups, expenses, and users

### Backend (TypeScript + Express)
- **RESTful API**: REST endpoints for groups and expenses
- **PostgreSQL Database**: Reliable data storage with migrations
- **TypeScript**: Full type safety and modern development practices
- **Middleware**: Validation, error handling, request ID tracking, and logging
- **Services**: Database-backed business logic and operations

## Getting Started

### Prerequisites

- Xcode 15.0+ (for iOS development)
- Node.js 18.0+ (for backend)
- PostgreSQL 12+ (for database)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment and database:
   ```bash
   npm run setup:db
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001`

### iOS App Setup

1. Open `Killshot.xcodeproj` in Xcode
2. Select your target device or simulator
3. Build and run the project (⌘+R)

## API Endpoints

### Groups
- `GET /api/v1/groups` - Get all groups
- `GET /api/v1/groups/:id` - Get specific group
- `POST /api/v1/groups` - Create new group
- `PUT /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group

### Expenses
- `GET /api/v1/expenses` - Get all expenses
- `POST /api/v1/expenses` - Create new expense
- `GET /api/v1/expenses/group/:groupId` - Get expenses for group

## Database Schema

### Groups Table
- `id` (VARCHAR) - Primary key
- `name` (VARCHAR) - Group name
- `description` (TEXT) - Group description
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### Members Table
- `id` (VARCHAR) - Primary key
- `name` (VARCHAR) - Member name
- `email` (VARCHAR) - Member email
- `joined_at` (TIMESTAMP) - Join timestamp

### Expenses Table
- `id` (VARCHAR) - Primary key
- `title` (VARCHAR) - Expense title
- `amount` (DECIMAL) - Expense amount
- `paid_by` (VARCHAR) - Who paid the expense
- `group_id` (VARCHAR) - Associated group
- `split_type` (VARCHAR) - How to split (equal, custom)
- `date` (TIMESTAMP) - Expense date
- `description` (TEXT) - Expense description

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

iOS tests:
- Open Xcode
- Press ⌘+U to run tests

### Code Style

- **Swift**: Follow Swift API Design Guidelines
- **TypeScript**: Use ESLint and Prettier with TypeScript rules
- **Database**: Use snake_case for column names

## Recent Improvements

### iOS App
- ✅ Simplified navigation logic
- ✅ Added comprehensive input validation
- ✅ Improved error handling and user feedback
- ✅ Fixed deprecation warnings
- ✅ Added unit tests for core models

### Backend
- ✅ Complete TypeScript migration with full type safety
- ✅ Database migration system with PostgreSQL
- ✅ Comprehensive error handling and validation
- ✅ Request validation and sanitization
- ✅ Rate limiting and security headers
- ✅ Database-backed services (no in-memory storage)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
