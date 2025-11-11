#!/bin/bash

# Test script for cluster state synchronization
# Usage: ./test-cluster.sh

BASE_URL="http://localhost:4000/api/users"

echo "=== Testing Cluster State Synchronization ==="
echo ""

# Test 1: Create user (should go to worker 1)
echo "1. Creating user (request to worker 1)..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"username":"Alice","age":25,"hobbies":["reading","coding"]}')
echo "Response: $CREATE_RESPONSE"
USER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created user ID: $USER_ID"
echo ""

sleep 1

# Test 2: Get user (should go to worker 2)
echo "2. Getting user from different worker (request to worker 2)..."
GET_RESPONSE=$(curl -s $BASE_URL/$USER_ID)
echo "Response: $GET_RESPONSE"
echo ""

sleep 1

# Test 3: Update user (should go to worker 3)
echo "3. Updating user (request to worker 3)..."
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"username":"Alice Updated","age":26,"hobbies":["reading","coding","gaming"]}')
echo "Response: $UPDATE_RESPONSE"
echo ""

sleep 1

# Test 4: Get updated user (should go to worker 4)
echo "4. Getting updated user (request to worker 4)..."
GET_UPDATED_RESPONSE=$(curl -s $BASE_URL/$USER_ID)
echo "Response: $GET_UPDATED_RESPONSE"
echo ""

sleep 1

# Test 5: Delete user (should go to worker 5)
echo "5. Deleting user (request to worker 5)..."
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/$USER_ID)
echo "Response: $DELETE_RESPONSE"
echo ""

sleep 1

# Test 6: Try to get deleted user (should go to worker 6)
echo "6. Getting deleted user - should return 404 (request to worker 6)..."
GET_DELETED_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}" $BASE_URL/$USER_ID)
echo "Response: $GET_DELETED_RESPONSE"
echo ""

# Test 7: List all users (should go to worker 7)
echo "7. Listing all users (request to worker 7)..."
LIST_RESPONSE=$(curl -s $BASE_URL)
echo "Response: $LIST_RESPONSE"
echo ""

echo "=== Test Complete ==="
