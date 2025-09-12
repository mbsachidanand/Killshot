# Code Formatting & Linting Setup

This document explains the code formatting and linting setup for the Killshot project.

## 🎯 Overview

The project uses different tools for different languages to ensure consistent code formatting:

- **Backend (Node.js)**: ESLint + Prettier
- **Frontend (Swift)**: SwiftLint + SwiftFormat
- **Editor**: EditorConfig + VS Code settings

## 📁 Configuration Files

### Backend (Node.js)
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `package.json` - NPM scripts for linting/formatting

### Frontend (Swift)
- `.swiftlint.yml` - SwiftLint configuration
- `.swiftformat` - SwiftFormat configuration
- `setup-swiftlint.sh` - SwiftLint installation script

### Editor
- `.editorconfig` - Cross-editor configuration
- `.vscode/settings.json` - VS Code settings
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/tasks.json` - Development tasks
- `.vscode/launch.json` - Debug configurations
- `Killshot.code-workspace` - VS Code workspace

## 🚀 Quick Start

### 1. Install SwiftLint (iOS)
```bash
# Run the setup script
./setup-swiftlint.sh

# Or install manually
brew install swiftlint
```

### 2. Install VS Code Extensions
Open VS Code and install the recommended extensions, or run:
```bash
code --install-extension sswg.swift-lang
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

### 3. Format Code
```bash
# Backend
cd backend
npm run format

# Frontend
swiftlint --fix
swiftformat .

# Or use VS Code tasks
# Ctrl+Shift+P -> "Tasks: Run Task" -> Select formatting task
```

## 📋 Available Commands

### Backend Commands
```bash
cd backend

# Linting
npm run lint          # Check for linting issues
npm run lint:fix      # Fix auto-fixable issues

# Formatting
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted

# Development
npm run dev           # Start development server
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
```

### Frontend Commands
```bash
# SwiftLint
swiftlint                    # Check for issues
swiftlint --fix             # Fix auto-fixable issues
swiftlint --config .swiftlint.yml  # Use specific config

# SwiftFormat
swiftformat .               # Format all Swift files
swiftformat --config .swiftformat  # Use specific config
```

## ⚙️ Configuration Details

### ESLint Rules
- 2-space indentation
- Single quotes
- Semicolons required
- Max line length: 100 characters
- Unix line endings
- No unused variables (except with underscore prefix)

### Prettier Settings
- Print width: 100 characters
- Tab width: 2 spaces
- Single quotes
- No trailing commas
- Semicolons enabled

### SwiftLint Rules
- 4-space indentation
- Max line length: 120 characters
- Enforce MARK comments
- Require documentation for public APIs
- Custom rules for SwiftUI best practices

### SwiftFormat Settings
- 4-space indentation
- Max width: 120 characters
- Wrap arguments before first
- Balanced closing parentheses
- Inline commas
- Always use semicolons

## 🔧 VS Code Integration

### Automatic Formatting
- Format on save: ✅ Enabled
- Format on paste: ✅ Enabled
- Format on type: ❌ Disabled (performance)

### Code Actions on Save
- Fix ESLint issues: ✅ Enabled
- Organize imports: ✅ Enabled

### Language-Specific Settings
- JavaScript/TypeScript: Prettier
- Swift: SwiftFormat
- JSON: Prettier
- YAML: Prettier
- Markdown: Prettier

## 🎯 Best Practices

### 1. Commit Hooks (Recommended)
Add pre-commit hooks to ensure code is formatted before commits:

```bash
# Install husky
cd backend
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write", "git add"]
  }
}
```

### 2. CI/CD Integration
Add formatting checks to your CI pipeline:

```yaml
# .github/workflows/format-check.yml
name: Format Check
on: [push, pull_request]
jobs:
  format-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Backend Format
        run: |
          cd backend
          npm install
          npm run format:check
      - name: Check iOS Format
        run: |
          brew install swiftlint
          swiftlint
```

### 3. Team Guidelines
- Always format code before committing
- Use VS Code tasks for consistent formatting
- Review formatting in pull requests
- Keep configuration files in version control

## 🐛 Troubleshooting

### SwiftLint Issues
```bash
# Check if SwiftLint is installed
which swiftlint

# Check configuration
swiftlint config

# Run with verbose output
swiftlint --verbose
```

### ESLint Issues
```bash
# Check if ESLint is installed
cd backend
npx eslint --version

# Check configuration
npx eslint --print-config src/server.js
```

### VS Code Issues
- Ensure extensions are installed
- Check workspace settings
- Reload VS Code window
- Check output panel for errors

## 📚 Resources

- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [SwiftLint Documentation](https://github.com/realm/SwiftLint)
- [SwiftFormat Documentation](https://github.com/nicklockwood/SwiftFormat)
- [EditorConfig Documentation](https://editorconfig.org/)

## 🤝 Contributing

When contributing to this project:

1. Ensure your code is properly formatted
2. Run linting checks before committing
3. Use the provided VS Code tasks
4. Follow the established coding standards
5. Update configuration files if needed (with team approval)
