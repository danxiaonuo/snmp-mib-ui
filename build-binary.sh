#!/bin/bash

echo "🚀 Building optimized binary deployment..."

# Clean previous builds
rm -rf .next dist

# Set production environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Build the application with simplified options
echo "📦 Building Next.js application..."
npx next build --no-lint

# Create optimized binary distribution
echo "📁 Creating binary distribution..."
mkdir -p dist

# Copy standalone build
cp -r .next/standalone/* dist/
mkdir -p dist/.next
cp -r .next/static dist/.next/static
cp -r public dist/public

# Create startup script
cat > dist/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=${PORT:-12300}
export HOSTNAME=${HOSTNAME:-0.0.0.0}
node server.js
EOF

chmod +x dist/start.sh

# Create systemd service file
cat > dist/snmp-mib-platform.service << 'EOF'
[Unit]
Description=SNMP MIB Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/snmp-mib-platform
ExecStart=/opt/snmp-mib-platform/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=12300

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Binary build completed!"
echo "📂 Distribution files are in: ./dist/"
echo "🚀 To run: cd dist && ./start.sh"
echo "📋 To install as service: sudo cp snmp-mib-platform.service /etc/systemd/system/"