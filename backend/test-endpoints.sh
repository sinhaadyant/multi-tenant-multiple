#!/bin/bash

echo "🧪 Starting E2E API Tests..."
echo "=================================="

# Start server in background
npx ts-node src/minimal-server.ts &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "🔍 Testing Health Check..."
curl -X GET "http://localhost:3000/health" | jq '.'

echo -e "\n🔐 Testing Login with Admin User..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo $LOGIN_RESPONSE | jq '.'

if echo $LOGIN_RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ Login test PASSED"
  
  # Extract token for further tests
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken')
  echo "🎫 Token extracted: ${TOKEN:0:50}..."
else
  echo "❌ Login test FAILED"
fi

echo -e "\n📝 Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"MySecure123!","firstName":"John","lastName":"Doe"}')

echo $REGISTER_RESPONSE | jq '.'

if echo $REGISTER_RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ Registration test PASSED"
else
  echo "❌ Registration test FAILED"
fi

echo -e "\n🧹 Cleaning up..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "🎉 E2E Tests completed!"
