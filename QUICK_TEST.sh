#!/bin/bash

# Quick Test Script for Consent Generation
# This script runs through the basic tests

echo "🧪 Testing Consent Generation"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start it with: npm run dev${NC}"
    exit 1
fi
echo ""

# Test 2: Auth Status
echo "2️⃣ Checking Authentication..."
AUTH_RESPONSE=$(curl -s "$BASE_URL/api/auth/status")
if echo "$AUTH_RESPONSE" | grep -q "authenticated"; then
    echo -e "${GREEN}✅ Authentication is working${NC}"
else
    echo -e "${YELLOW}⚠️  Authentication may not be set up. Trying to login...${NC}"
    curl -X POST "$BASE_URL/api/auth/login" -s | head -c 200
    echo ""
fi
echo ""

# Test 3: Minimal Consent Request
echo "3️⃣ Testing Minimal Consent Request (Required Fields Only)..."
CONSENT_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/aa/consents/initiate" \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user_'$(date +%s)'",
    "mobile": "9876543210",
    "fi_types": ["DEPOSIT"]
  }')

if echo "$CONSENT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Consent generation successful!${NC}"
    echo "Response:"
    echo "$CONSENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONSENT_RESPONSE"
else
    echo -e "${RED}❌ Consent generation failed${NC}"
    echo "Response:"
    echo "$CONSENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONSENT_RESPONSE"
fi
echo ""

# Test 4: Error Test - Missing Mobile
echo "4️⃣ Testing Error Handling (Missing Mobile)..."
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/internal/aa/consents/initiate" \
  -H "Content-Type: application/json" \
  -d '{
    "internal_user_id": "test_user",
    "fi_types": ["DEPOSIT"]
  }')

if echo "$ERROR_RESPONSE" | grep -q "mobile is required"; then
    echo -e "${GREEN}✅ Error handling works correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected error response${NC}"
    echo "$ERROR_RESPONSE"
fi
echo ""

echo "=============================="
echo "✅ Quick test completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Check server logs to see the payload being sent"
echo "   2. Verify the payload structure matches Saafe API spec"
echo "   3. Check MongoDB for stored consent request"
echo "   4. See TEST_CONSENT_NEW.md for detailed testing guide"
echo ""

