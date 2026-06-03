#!/bin/bash
set -e

echo "🚀 Building Universal File Editor extension..."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the compilation step to make sure everything is up to date
echo "🔨 Compiling extension..."
npm run compile

# Package the extension into a .vsix file using vsce
echo "📦 Packaging into .vsix format..."
npx vsce package

VSIX_FILE=$(ls -t *.vsix | head -1)

if [ -n "$VSIX_FILE" ]; then
    echo "✅ Successfully created: $VSIX_FILE"
    echo ""
    echo "To install and test this extension locally, run:"
    echo "code --install-extension $VSIX_FILE"
else
    echo "❌ Failed to create .vsix file."
    exit 1
fi
