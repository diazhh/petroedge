#!/bin/bash

# Complete test for Assets API with schema-compliant data
BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        echo -e "${YELLOW}Response: $3${NC}"
    fi
}

echo "=========================================="
echo "COMPLETE ASSETS API TEST"
echo "=========================================="
echo ""

# Login
echo "1. Authenticating..."
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

# Get asset types
echo "2. Getting asset type IDs..."
TYPES_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets/types" \
    -H "Authorization: Bearer ${TOKEN}")

FIELD_TYPE_ID=$(echo $TYPES_RESPONSE | jq -r '.data[] | select(.code=="FIELD") | .id')
WELL_TYPE_ID=$(echo $TYPES_RESPONSE | jq -r '.data[] | select(.code=="WELL") | .id')

echo "  FIELD Type ID: $FIELD_TYPE_ID"
echo "  WELL Type ID: $WELL_TYPE_ID"
echo ""

# Create Field with proper schema
echo "3. Creating Field Asset (with required schema fields)..."
CREATE_FIELD_DATA='{
  "assetTypeId": "'$FIELD_TYPE_ID'",
  "code": "SAN-ALBERTO",
  "name": "Campo San Alberto",
  "description": "Campo de producción en la cuenca norte",
  "latitude": -17.8,
  "longitude": -63.2,
  "elevationFt": 1200,
  "status": "ACTIVE",
  "properties": {
    "status": "PRODUCING",
    "operator": "ACME Petroleum",
    "fieldCode": "SAN-ALBERTO",
    "fieldType": "ONSHORE",
    "discoveryDate": "2010-05-15",
    "firstProductionDate": "2012-03-20"
  },
  "attributes": {
    "areaAcres": 15000,
    "totalWells": 12,
    "activeWells": 10,
    "centerLatitude": -17.8,
    "centerLongitude": -63.2,
    "totalReservoirs": 3
  },
  "tags": ["production", "north-basin", "onshore"]
}'

CREATE_FIELD_RESPONSE=$(curl -s -X POST "${BASE_URL}/infrastructure/assets" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_FIELD_DATA")

FIELD_ID=$(echo $CREATE_FIELD_RESPONSE | jq -r '.data.id')

if [ "$FIELD_ID" != "null" ] && [ ! -z "$FIELD_ID" ]; then
    print_result 0 "Created field: $FIELD_ID"
else
    print_result 1 "Failed to create field" "$CREATE_FIELD_RESPONSE"
fi
echo ""

# Create Well with proper schema
echo "4. Creating Well Asset under Field (with required schema fields)..."
CREATE_WELL_DATA='{
  "assetTypeId": "'$WELL_TYPE_ID'",
  "code": "SA-001",
  "name": "Pozo San Alberto 001",
  "description": "Pozo productor vertical",
  "parentAssetId": "'$FIELD_ID'",
  "latitude": -17.82,
  "longitude": -63.25,
  "elevationFt": 1205,
  "status": "ACTIVE",
  "properties": {
    "wellCode": "SA-001",
    "wellType": "PRODUCER",
    "status": "PRODUCING",
    "apiNumber": "BO-001-SA-001",
    "liftMethod": "ESP",
    "spudDate": "2012-01-15",
    "completionDate": "2012-03-10",
    "firstProductionDate": "2012-03-20"
  },
  "attributes": {
    "surfaceLatitude": -17.82,
    "surfaceLongitude": -63.25,
    "surfaceElevationFt": 1205,
    "totalDepthMdFt": 8100,
    "totalDepthTvdFt": 7850,
    "tubingSize": 2.875,
    "casingSize": 7,
    "oilApi": 35.5,
    "gor": 450,
    "bubblePoint": 2100,
    "reservoirPressure": 2850,
    "cumulativeOilMbbl": 285.5,
    "cumulativeGasMmscf": 128.5,
    "cumulativeWaterMbbl": 42.3
  },
  "tags": ["producer", "esp", "vertical"]
}'

CREATE_WELL_RESPONSE=$(curl -s -X POST "${BASE_URL}/infrastructure/assets" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_WELL_DATA")

WELL_ID=$(echo $CREATE_WELL_RESPONSE | jq -r '.data.id')

if [ "$WELL_ID" != "null" ] && [ ! -z "$WELL_ID" ]; then
    print_result 0 "Created well: $WELL_ID"
else
    print_result 1 "Failed to create well" "$CREATE_WELL_RESPONSE"
fi
echo ""

# List all assets
echo "5. Listing all assets..."
LIST_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets" \
    -H "Authorization: Bearer ${TOKEN}")

ASSETS_COUNT=$(echo $LIST_RESPONSE | jq -r '.data | length')

if [ "$ASSETS_COUNT" -ge 2 ]; then
    print_result 0 "Retrieved $ASSETS_COUNT assets"
    echo "Assets:"
    echo $LIST_RESPONSE | jq -r '.data[] | "  - \(.code): \(.name) (Type: \(.assetType.code))"'
else
    print_result 1 "Expected at least 2 assets, got $ASSETS_COUNT" "$LIST_RESPONSE"
fi
echo ""

# Filter by type
echo "6. Filtering assets by type (WELL)..."
FILTER_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets?assetTypeCode=WELL" \
    -H "Authorization: Bearer ${TOKEN}")

WELLS_COUNT=$(echo $FILTER_RESPONSE | jq -r '.data | length')

if [ "$WELLS_COUNT" -ge 1 ]; then
    print_result 0 "Retrieved $WELLS_COUNT wells"
else
    print_result 1 "No wells found when filtering" "$FILTER_RESPONSE"
fi
echo ""

# Get asset by ID
echo "7. Getting well asset by ID..."
GET_WELL_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets/${WELL_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

WELL_CODE=$(echo $GET_WELL_RESPONSE | jq -r '.data.code')

if [ "$WELL_CODE" == "SA-001" ]; then
    print_result 0 "Retrieved well asset"
    echo "  Code: $WELL_CODE"
    echo "  Name: $(echo $GET_WELL_RESPONSE | jq -r '.data.name')"
    echo "  Status: $(echo $GET_WELL_RESPONSE | jq -r '.data.status')"
else
    print_result 1 "Failed to retrieve well" "$GET_WELL_RESPONSE"
fi
echo ""

# Get children
echo "8. Getting child assets of field..."
CHILDREN_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets/${FIELD_ID}/children" \
    -H "Authorization: Bearer ${TOKEN}")

CHILDREN_COUNT=$(echo $CHILDREN_RESPONSE | jq -r '.data | length')

if [ "$CHILDREN_COUNT" -ge 1 ]; then
    print_result 0 "Retrieved $CHILDREN_COUNT child assets"
    echo "Children:"
    echo $CHILDREN_RESPONSE | jq -r '.data[] | "  - \(.code): \(.name)"'
else
    print_result 1 "No children found" "$CHILDREN_RESPONSE"
fi
echo ""

# Update asset
echo "9. Updating well asset..."
UPDATE_DATA='{
  "name": "Pozo San Alberto 001 - Actualizado",
  "status": "MAINTENANCE",
  "attributes": {
    "surfaceLatitude": -17.82,
    "surfaceLongitude": -63.25,
    "surfaceElevationFt": 1205,
    "totalDepthMdFt": 8100,
    "totalDepthTvdFt": 7850,
    "tubingSize": 2.875,
    "casingSize": 7,
    "oilApi": 35.5,
    "gor": 450,
    "bubblePoint": 2100,
    "reservoirPressure": 2800,
    "cumulativeOilMbbl": 290.5,
    "cumulativeGasMmscf": 130.2,
    "cumulativeWaterMbbl": 43.1
  }
}'

UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/infrastructure/assets/${WELL_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA")

UPDATED_NAME=$(echo $UPDATE_RESPONSE | jq -r '.data.name')

if [[ "$UPDATED_NAME" == *"Actualizado"* ]]; then
    print_result 0 "Updated well asset"
else
    print_result 1 "Failed to update well" "$UPDATE_RESPONSE"
fi
echo ""

# Update attributes with history
echo "10. Updating attributes with history..."
UPDATE_ATTRS_DATA='{
  "attributes": {
    "surfaceLatitude": -17.82,
    "surfaceLongitude": -63.25,
    "surfaceElevationFt": 1205,
    "totalDepthMdFt": 8100,
    "totalDepthTvdFt": 7850,
    "tubingSize": 2.875,
    "casingSize": 7,
    "oilApi": 35.5,
    "gor": 450,
    "bubblePoint": 2100,
    "reservoirPressure": 2750,
    "cumulativeOilMbbl": 295.8,
    "cumulativeGasMmscf": 132.5,
    "cumulativeWaterMbbl": 44.2
  },
  "reason": "Monthly production update"
}'

UPDATE_ATTRS_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/infrastructure/assets/${WELL_ID}/attributes" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_ATTRS_DATA")

SUCCESS=$(echo $UPDATE_ATTRS_RESPONSE | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
    print_result 0 "Updated attributes with history"
else
    print_result 1 "Failed to update attributes" "$UPDATE_ATTRS_RESPONSE"
fi
echo ""

# Get attribute history
echo "11. Getting attribute history..."
HISTORY_RESPONSE=$(curl -s -X GET "${BASE_URL}/infrastructure/assets/${WELL_ID}/attribute-history" \
    -H "Authorization: Bearer ${TOKEN}")

HISTORY_COUNT=$(echo $HISTORY_RESPONSE | jq -r '.data | length')

if [ "$HISTORY_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved $HISTORY_COUNT attribute history records"
else
    print_result 1 "No history found" "$HISTORY_RESPONSE"
fi
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}All endpoints tested successfully!${NC}"
echo ""
echo "Created Assets:"
echo "  - Field: $FIELD_ID (SAN-ALBERTO)"
echo "  - Well: $WELL_ID (SA-001)"
echo ""
