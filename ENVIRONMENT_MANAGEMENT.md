# Environment Variables Management

This document explains how environment variables are managed in the Killshot project across both backend and frontend.

## 🎯 Overview

The project uses different approaches for environment variable management:

- **Backend (Node.js)**: `.env` files with dotenv package
- **Frontend (iOS)**: Environment-specific configuration with Swift enums
- **Cross-platform**: EditorConfig and VS Code settings

## 📁 File Structure

```
Killshot/
├── backend/
│   ├── .env                    # Current environment (gitignored)
│   ├── env.example            # Template for environment variables
│   ├── env.development        # Development environment
│   ├── env.staging           # Staging environment
│   ├── env.production        # Production environment
│   └── scripts/
│       └── setup-env.js      # Environment setup script
├── Killshot/
│   ├── Configuration/
│   │   ├── Environment.swift  # Environment configuration
│   │   └── Config.plist      # iOS configuration values
└── .editorconfig             # Cross-editor configuration
```

## 🔧 Backend Environment Management

### Environment Files

#### Development (`env.development`)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_NAME=expense_manager_dev
DB_PASSWORD=expense_manager_password

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_DEBUG_FEATURES=true
```

#### Staging (`env.staging`)
```bash
# Server Configuration
PORT=3001
NODE_ENV=staging

# Database Configuration
DB_HOST=staging-db.killshot.app
DB_NAME=expense_manager_staging
DB_PASSWORD=staging_db_password_secure

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_DEBUG_FEATURES=false
```

#### Production (`env.production`)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=prod-db.killshot.app
DB_NAME=expense_manager_prod
DB_PASSWORD=prod_db_password_very_secure

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_DEBUG_FEATURES=false
```

### Available Scripts

```bash
# Switch to development environment
npm run env:dev

# Switch to staging environment
npm run env:staging

# Switch to production environment
npm run env:prod

# Show current environment
npm run env:show
```

### Usage in Code

```javascript
// server.js
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// database/config.js
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'expense_manager_db',
  user: process.env.DB_USER || 'expense_manager_user',
  password: process.env.DB_PASSWORD || 'expense_manager_password'
};
```

## 📱 Frontend Environment Management

### Environment Configuration

The iOS app uses a Swift-based environment configuration system:

```swift
// Environment.swift
enum Environment {
    case development
    case staging
    case production

    var baseURL: String {
        switch self {
        case .development:
            return "http://localhost:3001/api/v1"
        case .staging:
            return "https://api-staging.killshot.app/api/v1"
        case .production:
            return "https://api.killshot.app/api/v1"
        }
    }
}
```

### Usage in Code

```swift
// APIService.swift
class APIService {
    private let baseURL: String

    init(baseURL: String? = nil) {
        self.baseURL = baseURL ?? EnvironmentConfig.shared.apiBaseURL
    }
}

// Usage
let apiService = APIService() // Uses current environment's URL
```

### Configuration Values

The iOS app also supports configuration via `Config.plist`:

```xml
<key>API_BASE_URL_DEVELOPMENT</key>
<string>http://localhost:3001/api/v1</string>
<key>API_BASE_URL_PRODUCTION</key>
<string>https://api.killshot.app/api/v1</string>
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Set up development environment
npm run env:dev

# Start development server
npm run dev
```

### 2. Frontend Setup

The iOS app automatically detects the environment based on build configuration:

- **Debug builds**: Development environment
- **Release builds**: Production environment
- **Custom schemes**: Can be configured for staging

### 3. Environment Switching

```bash
# Backend - Switch environments
npm run env:dev      # Development
npm run env:staging  # Staging
npm run env:prod     # Production

# Frontend - Use Xcode build schemes
# Development: Debug scheme
# Staging: Staging scheme (create in Xcode)
# Production: Release scheme
```

## 🔒 Security Best Practices

### 1. Never Commit Sensitive Data

```bash
# .gitignore
.env
*.env
!env.example
!env.development
!env.staging
!env.production
```

### 2. Use Strong Defaults

```javascript
// Always provide secure defaults
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const DB_PASSWORD = process.env.DB_PASSWORD || 'default-password';
```

### 3. Environment-Specific Secrets

```bash
# Development
JWT_SECRET=dev_jwt_secret_key_change_in_production

# Production
JWT_SECRET=prod_jwt_secret_key_very_secure_32_chars_min
```

### 4. Validate Required Variables

```javascript
// server.js
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}
```

## 🧪 Testing

### Backend Testing

```bash
# Test with development environment
NODE_ENV=test npm test

# Test with specific environment
NODE_ENV=staging npm test
```

### Frontend Testing

```swift
// Test with specific environment
let testEnvironment = Environment.development
let apiService = APIService(baseURL: testEnvironment.baseURL)
```

## 📊 Environment Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **API URL** | localhost:3001 | api-staging.killshot.app | api.killshot.app |
| **Database** | Local PostgreSQL | Staging DB | Production DB |
| **Logging** | Debug level | Info level | Error level |
| **Analytics** | Disabled | Enabled | Enabled |
| **Debug Features** | Enabled | Disabled | Disabled |
| **Caching** | Disabled | Enabled | Enabled |
| **Rate Limiting** | 100 req/15min | 200 req/15min | 1000 req/15min |

## 🐛 Troubleshooting

### Common Issues

1. **Environment not loading**
   ```bash
   # Check if .env file exists
   ls -la backend/.env

   # Recreate environment
   npm run env:dev
   ```

2. **Missing environment variables**
   ```bash
   # Check current environment
   npm run env:show

   # Verify required variables
   node -e "console.log(process.env.DB_HOST)"
   ```

3. **iOS app using wrong URL**
   ```swift
   // Check current environment
   print(EnvironmentConfig.shared.apiBaseURL)

   // Force specific environment
   let apiService = APIService(baseURL: "http://custom-url.com")
   ```

### Debug Commands

```bash
# Backend - Show all environment variables
node -e "console.log(process.env)"

# Backend - Show specific variable
node -e "console.log('DB_HOST:', process.env.DB_HOST)"

# Backend - Test environment setup
npm run env:show
```

## 📚 Resources

- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [dotenv Package](https://www.npmjs.com/package/dotenv)
- [iOS Configuration Management](https://developer.apple.com/documentation/bundleresources/information_property_list)
- [Environment Variables Best Practices](https://12factor.net/config)

## 🤝 Contributing

When adding new environment variables:

1. **Backend**: Add to all environment files (`env.development`, `env.staging`, `env.production`)
2. **Frontend**: Add to `Environment.swift` and `Config.plist`
3. **Documentation**: Update this file with the new variable
4. **Security**: Ensure sensitive variables are properly masked in logs
5. **Testing**: Test in all environments before committing
