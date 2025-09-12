#!/bin/bash

# SwiftLint Setup Script for Killshot iOS App
# This script installs SwiftLint and sets up the project for code formatting

echo "🚀 Setting up SwiftLint for Killshot iOS App..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Install SwiftLint if not already installed
if ! command -v swiftlint &> /dev/null; then
    echo "📦 Installing SwiftLint..."
    brew install swiftlint
else
    echo "✅ SwiftLint is already installed"
fi

# Verify installation
if command -v swiftlint &> /dev/null; then
    echo "✅ SwiftLint installed successfully"
    swiftlint version
else
    echo "❌ Failed to install SwiftLint"
    exit 1
fi

# Create Xcode build phase script
echo "📝 Creating Xcode build phase script..."

# Create the script content
cat > "Scripts/swiftlint.sh" << 'EOF'
#!/bin/bash

# SwiftLint Build Phase Script
# This script runs SwiftLint during Xcode builds

if which swiftlint >/dev/null; then
    swiftlint
else
    echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi
EOF

# Make the script executable
chmod +x "Scripts/swiftlint.sh"

echo "✅ SwiftLint setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add a 'Run Script Phase' to your Xcode project:"
echo "   - Select your target in Xcode"
echo "   - Go to Build Phases"
echo "   - Click '+' and select 'New Run Script Phase'"
echo "   - Add this script: \${SRCROOT}/Scripts/swiftlint.sh"
echo "   - Move it before 'Compile Sources'"
echo ""
echo "2. Run SwiftLint manually:"
echo "   swiftlint"
echo ""
echo "3. Auto-fix issues:"
echo "   swiftlint --fix"
echo ""
echo "4. Run with specific rules:"
echo "   swiftlint --config .swiftlint.yml"
