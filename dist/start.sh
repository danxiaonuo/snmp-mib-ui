#!/bin/bash
export NODE_ENV=production
export PORT=12300
export HOSTNAME=0.0.0.0
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
node server.js