#!/bin/bash

# Generate self-signed SSL certificate for dev.np-topvitaminsupply.com

echo "🔐 Generating self-signed SSL certificate for dev.np-topvitaminsupply.com..."

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate private key
openssl genrsa -out certs/dev.np-topvitaminsupply.com.key 2048

# Generate certificate signing request
openssl req -new -key certs/dev.np-topvitaminsupply.com.key -out certs/dev.np-topvitaminsupply.com.csr -subj "/C=US/ST=CA/L=San Francisco/O=AGoat Publisher/OU=Development/CN=dev.np-topvitaminsupply.com"

# Generate self-signed certificate
openssl x509 -req -days 365 -in certs/dev.np-topvitaminsupply.com.csr -signkey certs/dev.np-topvitaminsupply.com.key -out certs/dev.np-topvitaminsupply.com.crt

# Set proper permissions
chmod 600 certs/dev.np-topvitaminsupply.com.key
chmod 644 certs/dev.np-topvitaminsupply.com.crt

echo "✅ SSL certificate generated successfully!"
echo "📁 Certificate files:"
echo "   - Private Key: certs/dev.np-topvitaminsupply.com.key"
echo "   - Certificate: certs/dev.np-topvitaminsupply.com.crt"
echo ""
echo "⚠️  Note: This is a self-signed certificate. Browsers will show a security warning."
echo "   You can ignore this warning for development purposes."
