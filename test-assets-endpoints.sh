#!/bin/bash

# Test script for Assets API endpoints
# This script tests the migration from yacimientos/pozos to assets

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        echo -e "${YELLOW}Response: $3${NC}"
    fi
}

# Function to make authenticated requests
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json"
    else
        curl -s -X $method "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

echo "=========================================="
echo "TESTING ASSETS API ENDPOINTS"
echo "=========================================="
echo ""

# Step 1: Login
echo "1. Testing Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@acme-petroleum.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
    print_result 0 "Authentication successful"
else
    print_result 1 "Authentication failed" "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Step 2: List Asset Types
echo "2. Testing GET /infrastructure/assets/types (List Asset Types)..."
TYPES_RESPONSE=$(api_call GET "/infrastructure/assets/types")
TYPES_COUNT=$(echo $TYPES_RESPONSE | jq -r '.data | length')

if [ "$TYPES_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved $TYPES_COUNT asset types"
    echo "Asset Types:"
    echo $TYPES_RESPONSE | jq -r '.data[] | "  - \(.code): \(.name)"'
else
    print_result 1 "No asset types found" "$TYPES_RESPONSE"
fi
echo ""

# Get asset type IDs for testing
FIELD_TYPE_ID=$(echo $TYPES_RESPONSE | jq -r '.data[] | select(.code=="FIELD") | .id')
WELL_TYPE_ID=$(echo $TYPES_RESPONSE | jq -r '.data[] | select(.code=="WELL") | .id')
RESERVOIR_TYPE_ID=$(echo $TYPES_RESPONSE | jq -r '.data[] | select(.code=="RESERVOIR") | .id')

echo "Asset Type IDs:"
echo "  - FIELD: $FIELD_TYPE_ID"
echo "  - WELL: $WELL_TYPE_ID"
echo "  - RESERVOIR: $RESERVOIR_TYPE_ID"
echo ""

# Step 3: Get specific asset type
echo "3. Testing GET /infrastructure/assets/types/:id (Get Asset Type by ID)..."
if [ ! -z "$FIELD_TYPE_ID" ]; then
    FIELD_TYPE_RESPONSE=$(api_call GET "/infrastructure/assets/types/${FIELD_TYPE_ID}")
    FIELD_TYPE_CODE=$(echo $FIELD_TYPE_RESPONSE | jq -r '.data.code')
    
    if [ "$FIELD_TYPE_CODE" == "FIELD" ]; then
        print_result 0 "Retrieved FIELD asset type"
    else
        print_result 1 "Failed to retrieve FIELD asset type" "$FIELD_TYPE_RESPONSE"
    fi
else
    print_result 1 "FIELD asset type not found"
fi
echo ""

# Step 4: Create a Field (Campo/Yacimiento)
echo "4. Testing POST /infrastructure/assets (Create Field Asset)..."
CREATE_FIELD_DATA='{
  "assetTypeId": "'$FIELD_TYPE_ID'",
  "code": "FIELD-001",
  "name": "Campo San Alberto",
  "description": "Campo de producción en la cuenca norte",
  "latitude": -17.8,
  "longitude": -63.2,
  "status": "ACTIVE",
  "properties": {
    "area_km2": 150.5,
    "discovery_date": "2010-05-15"
  },
  "attributes": {
    "operator": "ACME Petroleum",
    "production_status": "producing"
  },
  "tags": ["production", "north-basin"]
}'

CREATE_FIELD_RESPONSE=$(api_call POST "/infrastructure/assets" "$CREATE_FIELD_DATA")
FIELD_ID=$(echo $CREATE_FIELD_RESPONSE | jq -r '.data.id')

if [ "$FIELD_ID" != "null" ] && [ ! -z "$FIELD_ID" ]; then
    print_result 0 "Created field asset: $FIELD_ID"
else
    print_result 1 "Failed to create field asset" "$CREATE_FIELD_RESPONSE"
fi
echo ""

# Step 5: Create a Well (Pozo) under the Field
echo "5. Testing POST /infrastructure/assets (Create Well Asset under Field)..."
CREATE_WELL_DATA='{
  "assetTypeId": "'$WELL_TYPE_ID'",
  "code": "SA-001",
  "name": "Pozo San Alberto 001",
  "description": "Pozo productor vertical",
  "parentAssetId": "'$FIELD_ID'",
  "latitude": -17.82,
  "longitude": -63.25,
  "elevationFt": 1200,
  "status": "ACTIVE",
  "properties": {
    "well_type": "producer",
    "completion_type": "vertical",
    "total_depth_ft": 8500
  },
  "attributes": {
    "api_gravity": 35.5,
    "current_rate_bopd": 450
  },
  "tags": ["producer", "vertical"]
}'

CREATE_WELL_RESPONSE=$(api_call POST "/infrastructure/assets" "$CREATE_WELL_DATA")
WELL_ID=$(echo $CREATE_WELL_RESPONSE | jq -r '.data.id')

if [ "$WELL_ID" != "null" ] && [ ! -z "$WELL_ID" ]; then
    print_result 0 "Created well asset: $WELL_ID"
else
    print_result 1 "Failed to create well asset" "$CREATE_WELL_RESPONSE"
fi
echo ""

# Step 6: List all assets
echo "6. Testing GET /infrastructure/assets (List All Assets)..."
LIST_ASSETS_RESPONSE=$(api_call GET "/infrastructure/assets")
ASSETS_COUNT=$(echo $LIST_ASSETS_RESPONSE | jq -r '.data | length')

if [ "$ASSETS_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved $ASSETS_COUNT assets"
    echo "Assets:"
    echo $LIST_ASSETS_RESPONSE | jq -r '.data[] | "  - \(.code): \(.name) (Type: \(.assetType.code // "N/A"))"'
else
    print_result 1 "No assets found" "$LIST_ASSETS_RESPONSE"
fi
echo ""

# Step 7: Filter assets by type
echo "7. Testing GET /infrastructure/assets?assetTypeCode=WELL (Filter by Type)..."
FILTER_WELLS_RESPONSE=$(api_call GET "/infrastructure/assets?assetTypeCode=WELL")
WELLS_COUNT=$(echo $FILTER_WELLS_RESPONSE | jq -r '.data | length')

if [ "$WELLS_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved $WELLS_COUNT wells"
else
    print_result 1 "No wells found when filtering" "$FILTER_WELLS_RESPONSE"
fi
echo ""

# Step 8: Get asset by ID
echo "8. Testing GET /infrastructure/assets/:id (Get Asset by ID)..."
if [ ! -z "$WELL_ID" ]; then
    GET_WELL_RESPONSE=$(api_call GET "/infrastructure/assets/${WELL_ID}")
    WELL_CODE=$(echo $GET_WELL_RESPONSE | jq -r '.data.code')
    
    if [ "$WELL_CODE" == "SA-001" ]; then
        print_result 0 "Retrieved well asset by ID"
    else
        print_result 1 "Failed to retrieve well asset" "$GET_WELL_RESPONSE"
    fi
else
    print_result 1 "Well ID not available for testing"
fi
echo ""

# Step 9: Get child assets (wells of a field)
echo "9. Testing GET /infrastructure/assets/:id/children (Get Child Assets)..."
if [ ! -z "$FIELD_ID" ]; then
    CHILDREN_RESPONSE=$(api_call GET "/infrastructure/assets/${FIELD_ID}/children")
    CHILDREN_COUNT=$(echo $CHILDREN_RESPONSE | jq -r '.data | length')
    
    if [ "$CHILDREN_COUNT" -gt 0 ]; then
        print_result 0 "Retrieved $CHILDREN_COUNT child assets"
        echo "Children:"
        echo $CHILDREN_RESPONSE | jq -r '.data[] | "  - \(.code): \(.name)"'
    else
        print_result 1 "No child assets found" "$CHILDREN_RESPONSE"
    fi
else
    print_result 1 "Field ID not available for testing"
fi
echo ""

# Step 10: Update asset
echo "10. Testing PUT /infrastructure/assets/:id (Update Asset)..."
if [ ! -z "$WELL_ID" ]; then
    UPDATE_WELL_DATA='{
      "name": "Pozo San Alberto 001 - Actualizado",
      "status": "MAINTENANCE",
      "attributes": {
        "api_gravity": 35.5,
        "current_rate_bopd": 420,
        "last_maintenance": "2026-01-09"
      }
    }'
    
    UPDATE_WELL_RESPONSE=$(api_call PUT "/infrastructure/assets/${WELL_ID}" "$UPDATE_WELL_DATA")
    UPDATED_NAME=$(echo $UPDATE_WELL_RESPONSE | jq -r '.data.name')
    
    if [[ "$UPDATED_NAME" == *"Actualizado"* ]]; then
        print_result 0 "Updated well asset"
    else
        print_result 1 "Failed to update well asset" "$UPDATE_WELL_RESPONSE"
    fi
else
    print_result 1 "Well ID not available for testing"
fi
echo ""

# Step 11: Update asset attributes (with history)
echo "11. Testing PATCH /infrastructure/assets/:id/attributes (Update Attributes with History)..."
if [ ! -z "$WELL_ID" ]; then
    UPDATE_ATTRS_DATA='{
      "attributes": {
        "current_rate_bopd": 380,
        "last_test_date": "2026-01-09"
      },
      "reason": "Production decline observed"
    }'
    
    UPDATE_ATTRS_RESPONSE=$(api_call PATCH "/infrastructure/assets/${WELL_ID}/attributes" "$UPDATE_ATTRS_DATA")
    SUCCESS=$(echo $UPDATE_ATTRS_RESPONSE | jq -r '.success')
    
    if [ "$SUCCESS" == "true" ]; then
        print_result 0 "Updated asset attributes with history"
    else
        print_result 1 "Failed to update attributes" "$UPDATE_ATTRS_RESPONSE"
    fi
else
    print_result 1 "Well ID not available for testing"
fi
echo ""

# Step 12: Get attribute history
echo "12. Testing GET /infrastructure/assets/:id/attribute-history (Get Attribute History)..."
if [ ! -z "$WELL_ID" ]; then
    HISTORY_RESPONSE=$(api_call GET "/infrastructure/assets/${WELL_ID}/attribute-history")
    HISTORY_COUNT=$(echo $HISTORY_RESPONSE | jq -r '.data | length')
    
    if [ "$HISTORY_COUNT" -gt 0 ]; then
        print_result 0 "Retrieved $HISTORY_COUNT attribute history records"
    else
        print_result 1 "No attribute history found" "$HISTORY_RESPONSE"
    fi
else
    print_result 1 "Well ID not available for testing"
fi
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "All critical endpoints have been tested."
echo "Check the results above for any failures."
echo ""
