#!/bin/bash

# Script de prueba completo para módulos de Yacimientos
# Prueba CRUD completo en: Basins, Fields, Reservoirs, Wells

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@acme-petroleum.com"
ADMIN_PASSWORD="Admin123!"

echo "🧪 INICIANDO PRUEBAS DE MÓDULOS DE YACIMIENTOS"
echo "=============================================="
echo ""

# 1. AUTENTICACIÓN
echo "1️⃣  Autenticando como admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error en autenticación"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Autenticación exitosa"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. PRUEBAS DE BASINS
echo "2️⃣  PRUEBAS DE BASINS (Cuencas)"
echo "================================"

# GET - Listar basins
echo "📋 GET /basins - Listar cuencas..."
curl -s -X GET "$BASE_URL/basins?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ GET /basins OK"
else
  echo "❌ GET /basins FAILED"
fi

# POST - Crear basin
echo "➕ POST /basins - Crear cuenca..."
CREATE_BASIN=$(curl -s -X POST "$BASE_URL/basins" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cuenca de Prueba API",
    "basinType": "FORELAND",
    "country": "Venezuela",
    "region": "Test Region",
    "areaKm2": "50000",
    "age": "Tertiary",
    "tectonicSetting": "Test setting",
    "minLatitude": "8.0",
    "maxLatitude": "9.0",
    "minLongitude": "-70.0",
    "maxLongitude": "-69.0",
    "description": "Cuenca creada vía API para pruebas"
  }')

BASIN_ID=$(echo $CREATE_BASIN | jq -r '.data.id')
if [ "$BASIN_ID" != "null" ] && [ ! -z "$BASIN_ID" ]; then
  echo "✅ POST /basins OK - ID: $BASIN_ID"
  
  # Verificar que se creó el asset
  BASIN_ASSET=$(echo $CREATE_BASIN | jq -r '.data.asset.id')
  if [ "$BASIN_ASSET" != "null" ] && [ ! -z "$BASIN_ASSET" ]; then
    echo "✅ Asset creado automáticamente - Asset ID: $BASIN_ASSET"
  else
    echo "⚠️  Asset no encontrado en respuesta"
  fi
else
  echo "❌ POST /basins FAILED"
  echo $CREATE_BASIN | jq .
fi

# GET BY ID - Obtener basin específica
if [ ! -z "$BASIN_ID" ]; then
  echo "🔍 GET /basins/:id - Obtener cuenca específica..."
  curl -s -X GET "$BASE_URL/basins/$BASIN_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.id' > /dev/null
  if [ $? -eq 0 ]; then
    echo "✅ GET /basins/:id OK"
  else
    echo "❌ GET /basins/:id FAILED"
  fi

  # PUT - Actualizar basin
  echo "✏️  PUT /basins/:id - Actualizar cuenca..."
  UPDATE_BASIN=$(curl -s -X PUT "$BASE_URL/basins/$BASIN_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "description": "Cuenca actualizada vía API"
    }')
  
  if echo $UPDATE_BASIN | jq -e '.data.id' > /dev/null; then
    echo "✅ PUT /basins/:id OK"
  else
    echo "❌ PUT /basins/:id FAILED"
  fi

  # DELETE - Eliminar basin
  echo "🗑️  DELETE /basins/:id - Eliminar cuenca..."
  DELETE_BASIN=$(curl -s -X DELETE "$BASE_URL/basins/$BASIN_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $DELETE_BASIN | jq -e '.success' > /dev/null; then
    echo "✅ DELETE /basins/:id OK"
  else
    echo "❌ DELETE /basins/:id FAILED"
  fi
fi

echo ""

# 3. PRUEBAS DE FIELDS
echo "3️⃣  PRUEBAS DE FIELDS (Campos)"
echo "==============================="

# Obtener una basin existente para crear el field
EXISTING_BASIN=$(curl -s -X GET "$BASE_URL/basins?page=1&per_page=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# GET - Listar fields
echo "📋 GET /fields - Listar campos..."
curl -s -X GET "$BASE_URL/fields?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ GET /fields OK"
else
  echo "❌ GET /fields FAILED"
fi

# POST - Crear field
echo "➕ POST /fields - Crear campo..."
CREATE_FIELD=$(curl -s -X POST "$BASE_URL/fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"basinId\": \"$EXISTING_BASIN\",
    \"fieldName\": \"Campo de Prueba API\",
    \"fieldCode\": \"TEST-API\",
    \"operator\": \"Test Operator\",
    \"status\": \"PRODUCING\",
    \"fieldType\": \"ONSHORE\",
    \"discoveryDate\": \"2020-01-15\",
    \"firstProductionDate\": \"2021-06-01\",
    \"areaAcres\": \"25000\",
    \"centerLatitude\": \"9.5\",
    \"centerLongitude\": \"-65.5\",
    \"totalWells\": 5,
    \"activeWells\": 4,
    \"description\": \"Campo creado vía API para pruebas\"
  }")

FIELD_ID=$(echo $CREATE_FIELD | jq -r '.data.id')
if [ "$FIELD_ID" != "null" ] && [ ! -z "$FIELD_ID" ]; then
  echo "✅ POST /fields OK - ID: $FIELD_ID"
  
  # Verificar asset
  FIELD_ASSET=$(echo $CREATE_FIELD | jq -r '.data.asset.id')
  if [ "$FIELD_ASSET" != "null" ] && [ ! -z "$FIELD_ASSET" ]; then
    echo "✅ Asset creado automáticamente - Asset ID: $FIELD_ASSET"
  else
    echo "⚠️  Asset no encontrado en respuesta"
  fi
else
  echo "❌ POST /fields FAILED"
  echo $CREATE_FIELD | jq .
fi

# GET BY ID, PUT, DELETE para fields
if [ ! -z "$FIELD_ID" ]; then
  echo "🔍 GET /fields/:id..."
  curl -s -X GET "$BASE_URL/fields/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ GET /fields/:id OK" || echo "❌ GET /fields/:id FAILED"

  echo "✏️  PUT /fields/:id..."
  curl -s -X PUT "$BASE_URL/fields/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description": "Campo actualizado vía API"}' | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ PUT /fields/:id OK" || echo "❌ PUT /fields/:id FAILED"

  echo "🗑️  DELETE /fields/:id..."
  curl -s -X DELETE "$BASE_URL/fields/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.success' > /dev/null
  [ $? -eq 0 ] && echo "✅ DELETE /fields/:id OK" || echo "❌ DELETE /fields/:id FAILED"
fi

echo ""

# 4. PRUEBAS DE RESERVOIRS
echo "4️⃣  PRUEBAS DE RESERVOIRS (Yacimientos)"
echo "========================================"

# Obtener un field existente (usar el que acabamos de crear o uno de la DB)
EXISTING_FIELD=$(curl -s -X GET "$BASE_URL/fields?page=1&per_page=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id // .data[0].field.id // empty')

# Si no hay field, crear uno temporal
if [ -z "$EXISTING_FIELD" ] || [ "$EXISTING_FIELD" == "null" ]; then
  echo "⚠️  No hay fields disponibles, creando uno temporal..."
  TEMP_FIELD=$(curl -s -X POST "$BASE_URL/fields" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"basinId\": \"$EXISTING_BASIN\",
      \"fieldName\": \"Campo Temporal Test\",
      \"fieldCode\": \"TEMP-TEST\",
      \"operator\": \"Test\",
      \"status\": \"PRODUCING\",
      \"fieldType\": \"ONSHORE\",
      \"areaAcres\": \"10000\",
      \"centerLatitude\": \"9.0\",
      \"centerLongitude\": \"-65.0\",
      \"totalWells\": 1,
      \"activeWells\": 1
    }")
  EXISTING_FIELD=$(echo $TEMP_FIELD | jq -r '.data.id')
fi

# GET - Listar reservoirs
echo "📋 GET /reservoirs - Listar yacimientos..."
curl -s -X GET "$BASE_URL/reservoirs?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' > /dev/null
[ $? -eq 0 ] && echo "✅ GET /reservoirs OK" || echo "❌ GET /reservoirs FAILED"

# POST - Crear reservoir
echo "➕ POST /reservoirs - Crear yacimiento..."
CREATE_RESERVOIR=$(curl -s -X POST "$BASE_URL/reservoirs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldId\": \"$EXISTING_FIELD\",
    \"reservoirName\": \"Yacimiento de Prueba API\",
    \"reservoirCode\": \"TEST-RES-API\",
    \"formationName\": \"Test Formation\",
    \"formationAge\": \"Miocene\",
    \"lithology\": \"SANDSTONE\",
    \"fluidType\": \"BLACK_OIL\",
    \"driveMechanism\": \"WATER_DRIVE\",
    \"topDepthTvdFt\": \"5000\",
    \"bottomDepthTvdFt\": \"5500\",
    \"avgNetPayFt\": \"400\",
    \"avgPorosity\": 0.25,
    \"avgPermeabilityMd\": 500,
    \"avgWaterSaturation\": 0.30,
    \"initialPressurePsi\": \"2500\",
    \"currentPressurePsi\": \"2200\",
    \"reservoirTemperatureF\": \"190\",
    \"areaAcres\": 30000,
    \"ooipMmstb\": \"600\",
    \"recoveryFactor\": 0.30,
    \"description\": \"Yacimiento creado vía API para pruebas\"
  }")

RESERVOIR_ID=$(echo $CREATE_RESERVOIR | jq -r '.data.id')
if [ "$RESERVOIR_ID" != "null" ] && [ ! -z "$RESERVOIR_ID" ]; then
  echo "✅ POST /reservoirs OK - ID: $RESERVOIR_ID"
  
  RESERVOIR_ASSET=$(echo $CREATE_RESERVOIR | jq -r '.data.asset.id')
  if [ "$RESERVOIR_ASSET" != "null" ] && [ ! -z "$RESERVOIR_ASSET" ]; then
    echo "✅ Asset creado automáticamente - Asset ID: $RESERVOIR_ASSET"
  else
    echo "⚠️  Asset no encontrado en respuesta"
  fi
else
  echo "❌ POST /reservoirs FAILED"
  echo $CREATE_RESERVOIR | jq .
fi

# GET BY ID, PUT, DELETE para reservoirs
if [ ! -z "$RESERVOIR_ID" ]; then
  echo "🔍 GET /reservoirs/:id..."
  curl -s -X GET "$BASE_URL/reservoirs/$RESERVOIR_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ GET /reservoirs/:id OK" || echo "❌ GET /reservoirs/:id FAILED"

  echo "✏️  PUT /reservoirs/:id..."
  curl -s -X PUT "$BASE_URL/reservoirs/$RESERVOIR_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description": "Yacimiento actualizado vía API"}' | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ PUT /reservoirs/:id OK" || echo "❌ PUT /reservoirs/:id FAILED"

  echo "🗑️  DELETE /reservoirs/:id..."
  curl -s -X DELETE "$BASE_URL/reservoirs/$RESERVOIR_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.success' > /dev/null
  [ $? -eq 0 ] && echo "✅ DELETE /reservoirs/:id OK" || echo "❌ DELETE /reservoirs/:id FAILED"
fi

echo ""

# 5. PRUEBAS DE WELLS
echo "5️⃣  PRUEBAS DE WELLS (Pozos)"
echo "============================="

# GET - Listar wells
echo "📋 GET /wells - Listar pozos..."
curl -s -X GET "$BASE_URL/wells?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' > /dev/null
[ $? -eq 0 ] && echo "✅ GET /wells OK" || echo "❌ GET /wells FAILED"

# POST - Crear well
echo "➕ POST /wells - Crear pozo..."
CREATE_WELL=$(curl -s -X POST "$BASE_URL/wells" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"fieldId\": \"$EXISTING_FIELD\",
    \"wellName\": \"Pozo de Prueba API\",
    \"wellCode\": \"TEST-WELL-API\",
    \"apiNumber\": \"VE-TEST-API-001\",
    \"wellType\": \"PRODUCER\",
    \"status\": \"PRODUCING\",
    \"liftMethod\": \"ESP\",
    \"surfaceLatitude\": \"9.5\",
    \"surfaceLongitude\": \"-65.5\",
    \"surfaceElevationFt\": \"150\",
    \"totalDepthMdFt\": \"8000\",
    \"totalDepthTvdFt\": \"7950\",
    \"spudDate\": \"2022-01-15\",
    \"completionDate\": \"2022-03-20\",
    \"firstProductionDate\": \"2022-04-01\",
    \"tubingSize\": \"3.5\",
    \"casingSize\": \"9.625\",
    \"currentOilRateBopd\": \"500\",
    \"currentGasRateMscfd\": \"750\",
    \"currentWaterRateBwpd\": \"200\",
    \"cumulativeOilMbbl\": \"150\",
    \"cumulativeGasMmscf\": \"225\",
    \"cumulativeWaterMbbl\": \"60\",
    \"description\": \"Pozo creado vía API para pruebas\"
  }")

WELL_ID=$(echo $CREATE_WELL | jq -r '.data.id')
if [ "$WELL_ID" != "null" ] && [ ! -z "$WELL_ID" ]; then
  echo "✅ POST /wells OK - ID: $WELL_ID"
  
  WELL_ASSET=$(echo $CREATE_WELL | jq -r '.data.asset.id')
  if [ "$WELL_ASSET" != "null" ] && [ ! -z "$WELL_ASSET" ]; then
    echo "✅ Asset creado automáticamente - Asset ID: $WELL_ASSET"
  else
    echo "⚠️  Asset no encontrado en respuesta"
  fi
else
  echo "❌ POST /wells FAILED"
  echo $CREATE_WELL | jq .
fi

# GET BY ID, PUT, DELETE para wells
if [ ! -z "$WELL_ID" ]; then
  echo "🔍 GET /wells/:id..."
  curl -s -X GET "$BASE_URL/wells/$WELL_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ GET /wells/:id OK" || echo "❌ GET /wells/:id FAILED"

  echo "✏️  PUT /wells/:id..."
  curl -s -X PUT "$BASE_URL/wells/$WELL_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description": "Pozo actualizado vía API"}' | jq '.data.id' > /dev/null
  [ $? -eq 0 ] && echo "✅ PUT /wells/:id OK" || echo "❌ PUT /wells/:id FAILED"

  echo "🗑️  DELETE /wells/:id..."
  curl -s -X DELETE "$BASE_URL/wells/$WELL_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.success' > /dev/null
  [ $? -eq 0 ] && echo "✅ DELETE /wells/:id OK" || echo "❌ DELETE /wells/:id FAILED"
fi

echo ""
echo "=============================================="
echo "🎉 PRUEBAS COMPLETADAS"
echo "=============================================="
