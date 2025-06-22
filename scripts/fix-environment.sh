#!/bin/bash

# Script to fix environment-specific issues

echo "Checking environment and applying fixes..."

# Check if running in Docker
if [ -f /.dockerenv ]; then
  echo "Running in Docker environment"
  # Apply Docker-specific fixes
  export NEXT_TELEMETRY_DISABLED=1
  export NODE_OPTIONS="--max-old-space-size=2048"
fi

# Check for low memory environment
MEMORY=$(free -m | awk '/^Mem:/{print $2}')
if [ "$MEMORY" -lt 4000 ]; then
  echo "Low memory environment detected ($MEMORY MB)"
  export NODE_OPTIONS="--max-old-space-size=1024"
fi

# Check for Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "Warning: Node.js version is below recommended (v16+)"
  echo "Current version: $(node -v)"
  echo "Some features may not work correctly"
fi

# Check for browser compatibility
echo "Setting up for cross-browser compatibility"
export BROWSERSLIST_IGNORE_OLD_DATA=true

echo "Environment setup complete"