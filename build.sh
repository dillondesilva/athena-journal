#!/bin/bash

# Parse command line arguments
DEBUG_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--debug]"
            exit 1
            ;;
    esac
done

# Create athena-be directory for backend binary inside lm-journal/src-tauri
mkdir -p lm-journal/src-tauri/athena-be

# Build the backend for multiple platforms
cd backend

# Build for macOS ARM64 (Apple Silicon)
echo "Building for macOS ARM64..."
GOOS=darwin GOARCH=arm64 go build -o ../lm-journal/src-tauri/athena-be/athena-backend-aarch64-apple-darwin main.go

# Build for macOS Intel64
echo "Building for macOS Intel64..."
GOOS=darwin GOARCH=amd64 go build -o ../lm-journal/src-tauri/athena-be/athena-backend-x86_64-apple-darwin main.go

# Build for Windows AMD64
echo "Building for Windows AMD64..."
GOOS=windows GOARCH=amd64 go build -o ../lm-journal/src-tauri/athena-be/athena-backend-x86_64-pc-windows-msvc.exe main.go

# Build for Linux AMD64
echo "Building for Linux AMD64..."
GOOS=linux GOARCH=amd64 go build -o ../lm-journal/src-tauri/athena-be/athena-backend-x86_64-unknown-linux-gnu main.go

# Build for Linux ARM64
echo "Building for Linux ARM64..."
GOOS=linux GOARCH=arm64 go build -o ../lm-journal/src-tauri/athena-be/athena-backend-aarch64-unknown-linux-gnu main.go

cd ..

# Build the frontend
cd lm-journal
if [ "$DEBUG_MODE" = true ]; then
    echo "Building frontend in debug mode..."
    npm run tauri build -- --debug
else
    echo "Building frontend in release mode..."
    npm run tauri build
fi
cd ..

echo "Build completed! Backend binaries are in lm-journal/src-tauri/athena-be/ directory:"
echo "  - athena-backend-aarch64-apple-darwin (macOS ARM64)"
echo "  - athena-backend-x86_64-apple-darwin (macOS Intel64)"
echo "  - athena-backend-x86_64-pc-windows-msvc.exe (Windows AMD64)"
echo "  - athena-backend-x86_64-unknown-linux-gnu (Linux AMD64)"
echo "  - athena-backend-aarch64-unknown-linux-gnu (Linux ARM64)"
