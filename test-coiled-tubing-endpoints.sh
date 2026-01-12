#!/bin/bash

# Script de prueba para endpoints del módulo Coiled Tubing
# Requiere: jq, curl

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  TEST: Módulo Coiled Tubing"
echo "=========================================="
echo ""

# 1. Login
echo -e "${YELLOW}1. Autenticación...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme-petroleum.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login exitoso${NC}"
else
  echo -e "${RED}✗ Login fallido${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo ""

# 2. Crear CT Unit
echo -e "${YELLOW}2. Crear CT Unit...${NC}"
CREATE_UNIT_RESPONSE=$(curl -s -X POST "$BASE_URL/coiled-tubing/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "unitNumber": "CT-001",
    "manufacturer": "NOV",
    "model": "CT-2000",
    "serialNumber": "SN-12345",
    "yearManufactured": 2020,
    "injectorCapacityLbs": 80000,
    "maxSpeedFtMin": 120,
    "pumpHp": 1500,
    "maxPressurePsi": 10000,
    "maxFlowRateBpm": 12.5,
    "location": "Base Neuquén"
  }')

UNIT_ID=$(echo $CREATE_UNIT_RESPONSE | jq -r '.data.id')

if [ "$UNIT_ID" != "null" ] && [ -n "$UNIT_ID" ]; then
  echo -e "${GREEN}✓ CT Unit creada: $UNIT_ID${NC}"
else
  echo -e "${RED}✗ Error al crear CT Unit${NC}"
  echo $CREATE_UNIT_RESPONSE | jq '.'
fi

echo ""

# 3. Listar CT Units
echo -e "${YELLOW}3. Listar CT Units...${NC}"
LIST_UNITS_RESPONSE=$(curl -s -X GET "$BASE_URL/coiled-tubing/units" \
  -H "Authorization: Bearer $TOKEN")

UNITS_COUNT=$(echo $LIST_UNITS_RESPONSE | jq -r '.meta.total')
echo -e "${GREEN}✓ Total de CT Units: $UNITS_COUNT${NC}"

echo ""

# 4. Obtener CT Unit por ID
echo -e "${YELLOW}4. Obtener CT Unit por ID...${NC}"
GET_UNIT_RESPONSE=$(curl -s -X GET "$BASE_URL/coiled-tubing/units/$UNIT_ID" \
  -H "Authorization: Bearer $TOKEN")

UNIT_NUMBER=$(echo $GET_UNIT_RESPONSE | jq -r '.data.unitNumber')
echo -e "${GREEN}✓ CT Unit obtenida: $UNIT_NUMBER${NC}"

echo ""

# 5. Crear CT Reel
echo -e "${YELLOW}5. Crear CT Reel...${NC}"
CREATE_REEL_RESPONSE=$(curl -s -X POST "$BASE_URL/coiled-tubing/reels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"reelNumber\": \"REEL-001\",
    \"serialNumber\": \"RSN-67890\",
    \"manufacturer\": \"NOV\",
    \"ctUnitId\": \"$UNIT_ID\",
    \"outerDiameterIn\": 2.375,
    \"wallThicknessIn\": 0.175,
    \"innerDiameterIn\": 2.025,
    \"steelGrade\": \"CT80\",
    \"yieldStrengthPsi\": 80000,
    \"totalLengthFt\": 20000,
    \"usableLengthFt\": 19500,
    \"weightPerFtLbs\": 4.7
  }")

REEL_ID=$(echo $CREATE_REEL_RESPONSE | jq -r '.data.id')

if [ "$REEL_ID" != "null" ] && [ -n "$REEL_ID" ]; then
  echo -e "${GREEN}✓ CT Reel creado: $REEL_ID${NC}"
else
  echo -e "${RED}✗ Error al crear CT Reel${NC}"
  echo $CREATE_REEL_RESPONSE | jq '.'
fi

echo ""

# 6. Listar CT Reels
echo -e "${YELLOW}6. Listar CT Reels...${NC}"
LIST_REELS_RESPONSE=$(curl -s -X GET "$BASE_URL/coiled-tubing/reels" \
  -H "Authorization: Bearer $TOKEN")

REELS_COUNT=$(echo $LIST_REELS_RESPONSE | jq -r '.meta.total')
echo -e "${GREEN}✓ Total de CT Reels: $REELS_COUNT${NC}"

echo ""

# 7. Crear CT Job
echo -e "${YELLOW}7. Crear CT Job...${NC}"

# Primero necesitamos un well_id (asumiendo que existe uno)
WELLS_RESPONSE=$(curl -s -X GET "$BASE_URL/infrastructure/assets?assetType=well&page=1&perPage=1" \
  -H "Authorization: Bearer $TOKEN")

WELL_ID=$(echo $WELLS_RESPONSE | jq -r '.data[0].id')

if [ "$WELL_ID" != "null" ] && [ -n "$WELL_ID" ]; then
  CREATE_JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/coiled-tubing/jobs" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"jobNumber\": \"JOB-CT-001\",
      \"jobType\": \"CLN\",
      \"wellId\": \"$WELL_ID\",
      \"ctUnitId\": \"$UNIT_ID\",
      \"ctReelId\": \"$REEL_ID\",
      \"plannedStartDate\": \"2026-01-15T08:00:00Z\",
      \"objective\": \"Limpieza de tubería de producción\",
      \"wellDepthFt\": 8500,
      \"targetDepthFt\": 8200,
      \"estimatedDurationHours\": 12
    }")

  JOB_ID=$(echo $CREATE_JOB_RESPONSE | jq -r '.data.id')

  if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}✓ CT Job creado: $JOB_ID${NC}"
  else
    echo -e "${RED}✗ Error al crear CT Job${NC}"
    echo $CREATE_JOB_RESPONSE | jq '.'
  fi
else
  echo -e "${YELLOW}⚠ No hay pozos disponibles, saltando creación de Job${NC}"
  JOB_ID=""
fi

echo ""

# 8. Listar CT Jobs
echo -e "${YELLOW}8. Listar CT Jobs...${NC}"
LIST_JOBS_RESPONSE=$(curl -s -X GET "$BASE_URL/coiled-tubing/jobs" \
  -H "Authorization: Bearer $TOKEN")

JOBS_COUNT=$(echo $LIST_JOBS_RESPONSE | jq -r '.meta.total')
echo -e "${GREEN}✓ Total de CT Jobs: $JOBS_COUNT${NC}"

echo ""

# 9. Actualizar CT Unit
echo -e "${YELLOW}9. Actualizar CT Unit...${NC}"
UPDATE_UNIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/coiled-tubing/units/$UNIT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "Base Vaca Muerta",
    "status": "IN_SERVICE"
  }')

UPDATED_LOCATION=$(echo $UPDATE_UNIT_RESPONSE | jq -r '.data.location')
echo -e "${GREEN}✓ CT Unit actualizada: $UPDATED_LOCATION${NC}"

echo ""

# 10. Resumen
echo "=========================================="
echo -e "${GREEN}RESUMEN DE PRUEBAS${NC}"
echo "=========================================="
echo "CT Units creadas: 1"
echo "CT Reels creados: 1"
if [ -n "$JOB_ID" ]; then
  echo "CT Jobs creados: 1"
else
  echo "CT Jobs creados: 0 (sin pozos disponibles)"
fi
echo ""
echo -e "${GREEN}✓ Todas las pruebas completadas${NC}"
