#!/bin/bash

# Add dev.np-topvitaminsupply.com to hosts file for local development

echo "🌐 Setting up hosts file for dev.np-topvitaminsupply.com..."

# Check if the entry already exists
if grep -q "dev.np-topvitaminsupply.com" /etc/hosts; then
    echo "✅ dev.np-topvitaminsupply.com already exists in hosts file"
else
    echo "📝 Adding dev.np-topvitaminsupply.com to hosts file..."
    echo "127.0.0.1 dev.np-topvitaminsupply.com" | sudo tee -a /etc/hosts
    echo "✅ dev.np-topvitaminsupply.com added to hosts file"
fi

echo ""
echo "🔗 You can now access the application at:"
echo "   Frontend: https://dev.np-topvitaminsupply.com:3000"
echo "   API:      https://dev.np-topvitaminsupply.com:8080"
echo ""
echo "⚠️  Note: You'll need to accept the self-signed certificate in your browser"
