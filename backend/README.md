# Killshot Backend API

A robust Node.js backend API for the Killshot expense splitting application.

## Features

- **Groups Management**: Create, read, update, and delete groups
- **Member Management**: Add and remove members from groups
- **RESTful API**: Well-structured REST endpoints
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Security**: Helmet for security headers, CORS configuration, rate limiting
- **Logging**: Morgan for HTTP request logging
- **Environment Configuration**: Environment-based configuration

## API Endpoints

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/groups` | Get all groups |
| GET | `/api/v1/groups/:id` | Get a specific group |
| POST | `/api/v1/groups` | Create a new group |
| PUT | `/api/v1/groups/:id` | Update a group |
| DELETE | `/api/v1/groups/:id` | Delete a group |
| POST | `/api/v1/groups/:id/members` | Add member to group |
| DELETE | `/api/v1/groups/:id/members/:memberId` | Remove member from group |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   API_VERSION=v1
   API_BASE_URL=http://localhost:3001/api/v1
   CORS_ORIGIN=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Usage Examples

### Get All Groups
```bash
curl http://localhost:3001/api/v1/groups
```

### Create a New Group
```bash
curl -X POST http://localhost:3001/api/v1/groups \
  -H "Content-Type: application/json" \
  -d '{"name": "My Group", "description": "A sample group"}'
```

### Get a Specific Group
```bash
curl http://localhost:3001/api/v1/groups/1
```

### Add Member to Group
```bash
curl -X POST http://localhost:3001/api/v1/groups/1/members \
  -H "Content-Type: application/json" \
  -d '{"id": "user1", "name": "John Doe", "email": "john@example.com"}'
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middleware/     # Custom middleware
│   └── server.js       # Main server file
├── tests/              # Test files
├── package.json        # Dependencies and scripts
├── env.example         # Environment variables template
└── README.md          # This file
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Request validation using express-validator

## Development

### Running Tests
```bash
npm test
```

### Code Structure

The backend follows a layered architecture:

1. **Routes**: Define API endpoints and validation
2. **Controllers**: Handle HTTP requests and responses
3. **Services**: Contain business logic
4. **Models**: Define data structures
5. **Middleware**: Handle cross-cutting concerns

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## License

MIT License - see LICENSE file for details.
