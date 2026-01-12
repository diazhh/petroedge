#!/bin/bash
# Script para ejecutar el simulador con datos de ejemplo del seed

echo "==================================================================="
echo "COILED TUBING SIMULATOR - Usando datos del seed"
echo "==================================================================="
echo ""
echo "Este script simula el Job CT-2026-043 (Nitrogen Lift en progreso)"
echo ""
echo "NOTA: Debes reemplazar los UUIDs con los IDs reales de tu base de datos"
echo "      Query para obtener IDs:"
echo "      SELECT id, job_number FROM ct_jobs WHERE job_number = 'CT-2026-043';"
echo "      SELECT id, unit_number FROM ct_units WHERE unit_number = 'CT-UNIT-02';"
echo ""
echo "==================================================================="
echo ""

# IMPORTANTE: Reemplazar estos UUIDs con los valores reales de tu DB
JOB_ID="00000000-0000-0000-0000-000000000000"
UNIT_ID="00000000-0000-0000-0000-000000000000"

if [ "$JOB_ID" = "00000000-0000-0000-0000-000000000000" ]; then
    echo "ERROR: Debes editar este script y actualizar JOB_ID y UNIT_ID"
    echo "       con los valores reales de tu base de datos"
    exit 1
fi

python3 ct_simulator.py \
    --job-id "$JOB_ID" \
    --unit-id "$UNIT_ID" \
    --job-type N2L \
    --target-depth 6500 \
    --kafka-broker localhost:9092 \
    --kafka-topic ct.telemetry
