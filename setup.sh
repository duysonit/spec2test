#!/bin/bash

echo "====================================="
echo "Spec2Test Setup Script"
echo "====================================="
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your OPENAI_API_KEY"
else
    echo "✓ backend/.env already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local from example..."
    cp frontend/.env.example frontend/.env.local
else
    echo "✓ frontend/.env.local already exists"
fi

echo ""
echo "====================================="
echo "Setup Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OPENAI_API_KEY"
echo "2. Run: docker-compose up -d"
echo "3. Run: docker-compose exec backend python -m app.scripts.init_db"
echo "4. Visit http://localhost:3000"
echo ""
echo "Default login:"
echo "  Email: admin@spec2test.com"
echo "  Password: admin123"
echo ""
