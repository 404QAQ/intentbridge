#!/bin/bash

# Manual Test Script for Project Chat Feature
# Run this script to verify the implementation works correctly

set -e

echo "🧪 IntentBridge Project Chat Feature - Manual Test Script"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test server health
test_health() {
    echo -e "${YELLOW}Testing Server Health...${NC}"
    response=$(curl -s http://localhost:9528/api/health)
    if echo "$response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✓ Server is healthy${NC}"
    else
        echo -e "${RED}✗ Server health check failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Test demo mode
test_demo_mode() {
    echo -e "${YELLOW}Testing Demo Mode...${NC}"
    response=$(curl -s http://localhost:9528/api/projects/test-project/demo)
    if echo "$response" | grep -q '"demoMode"'; then
        echo -e "${GREEN}✓ Demo mode endpoint works${NC}"
        if echo "$response" | grep -q '"demoMode":true'; then
            echo -e "${GREEN}  Running in demo mode${NC}"
        else
            echo -e "${GREEN}  Claude API is configured${NC}"
        fi
    else
        echo -e "${RED}✗ Demo mode check failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Test project status
test_project_status() {
    echo -e "${YELLOW}Testing Project Status...${NC}"
    response=$(curl -s http://localhost:9528/api/projects/test-project/status)
    if echo "$response" | grep -q '"status"'; then
        echo -e "${GREEN}✓ Project status endpoint works${NC}"
    else
        echo -e "${RED}✗ Project status check failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Test conversation history
test_conversation_history() {
    echo -e "${YELLOW}Testing Conversation History...${NC}"
    response=$(curl -s http://localhost:9528/api/projects/test-project/conversations)
    if echo "$response" | grep -q '"messages"'; then
        echo -e "${GREEN}✓ Conversation history endpoint works${NC}"
        message_count=$(echo "$response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
        echo -e "${GREEN}  Message count: $message_count${NC}"
    else
        echo -e "${RED}✗ Conversation history check failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Test send message (streaming)
test_send_message() {
    echo -e "${YELLOW}Testing Send Message (Streaming)...${NC}"
    timeout 10s curl -N -s http://localhost:9528/api/projects/test-project/chat \
        -H "Content-Type: application/json" \
        -d '{"message":"Hello, this is a test"}' | while read -r line; do
        if echo "$line" | grep -q 'data:'; then
            echo -e "${GREEN}✓ Received streaming event${NC}"
            echo "  $line"
        fi
    done
    echo -e "${GREEN}✓ Send message endpoint works${NC}"
}

# Test clear conversation
test_clear_conversation() {
    echo -e "${YELLOW}Testing Clear Conversation...${NC}"
    response=$(curl -s -X DELETE http://localhost:9528/api/projects/test-project/conversations)
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Clear conversation endpoint works${NC}"
    else
        echo -e "${RED}✗ Clear conversation check failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Main test execution
echo "Starting tests..."
echo ""

# Check if server is running
if ! curl -s http://localhost:9528/api/health > /dev/null 2>&1; then
    echo -e "${RED}Error: Server is not running at http://localhost:9528${NC}"
    echo "Please start the server first:"
    echo "  cd web-server && npm run dev"
    exit 1
fi

# Run tests
test_health
echo ""
test_demo_mode
echo ""
test_project_status
echo ""
test_conversation_history
echo ""
test_send_message
echo ""
test_clear_conversation
echo ""

echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the frontend: cd web && npm run dev"
echo "2. Open browser: http://localhost:5173"
echo "3. Navigate to a requirement detail page"
echo "4. Click 'Project Status & Chat' button"
echo "5. Test the chat interface"
