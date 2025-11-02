#!/bin/bash

# Priority 3 ETL Test Script
# This script automates the testing of unified DAG for Priority 3 districts

set -e

echo "======================================"
echo "Priority 3 ETL Test - Starting"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/ota-eita/Documents/work/gokinjo"
cd "$PROJECT_DIR"

# Step 1: Environment check
echo "[1/6] Checking environment status..."
if make status > /dev/null 2>&1; then
    echo -e "${GREEN}Environment OK${NC}"
else
    echo -e "${RED}Environment check failed${NC}"
    exit 1
fi
echo ""

# Step 2: List DAGs
echo "[2/6] Listing available DAGs..."
make airflow-list-dags | grep tokyo_districts_etl_priority_3
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Unified DAG found${NC}"
else
    echo -e "${RED}Unified DAG not found${NC}"
    exit 1
fi
echo ""

# Step 3: Get baseline counts
echo "[3/6] Getting baseline data counts..."
BASELINE_WARDS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(DISTINCT ward_code) FROM areas;")
BASELINE_SCHOOLS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM schools;")
BASELINE_CRIMES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM crimes;")

echo "Baseline:"
echo "  Wards: ${BASELINE_WARDS}"
echo "  Schools: ${BASELINE_SCHOOLS}"
echo "  Crimes: ${BASELINE_CRIMES}"
echo ""

# Step 4: Run ETL
echo "[4/6] Executing Priority 3 ETL (this may take a few minutes)..."
make airflow-run-dag DAG_ID=tokyo_districts_etl_priority_3

# Wait for completion
echo "Waiting for ETL completion (60 seconds)..."
sleep 60
echo ""

# Step 5: Verify results
echo "[5/6] Verifying results..."
RESULT_WARDS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(DISTINCT ward_code) FROM areas;")
RESULT_SCHOOLS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM schools;")
RESULT_CRIMES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM crimes;")

echo "Results:"
echo "  Wards: ${RESULT_WARDS} (expected: 9+)"
echo "  Schools: ${RESULT_SCHOOLS} (expected: 40+)"
echo "  Crimes: ${RESULT_CRIMES} (expected: 88+)"
echo ""

# Check if Sumida data exists
SUMIDA_COUNT=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM areas WHERE ward_code = '13107';")
if [ "$SUMIDA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Sumida district data found: ${SUMIDA_COUNT} areas${NC}"
else
    echo -e "${RED}Sumida district data NOT found${NC}"
    exit 1
fi
echo ""

# Step 6: Data quality checks
echo "[6/6] Running data quality checks..."

# Check for duplicate schools (using location geometry directly)
DUPLICATE_SCHOOLS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM (SELECT location, COUNT(*) as cnt FROM schools GROUP BY ST_AsText(location) HAVING COUNT(*) > 1) as duplicates;")

# Check for duplicate crimes (using location_hash)
DUPLICATE_CRIMES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) - COUNT(DISTINCT location_hash) FROM crimes WHERE location_hash IS NOT NULL;")

if [ "$DUPLICATE_SCHOOLS" -eq 0 ] && [ "$DUPLICATE_CRIMES" -eq 0 ]; then
    echo -e "${GREEN}No duplicates found${NC}"
else
    echo -e "${YELLOW}Warning: Found ${DUPLICATE_SCHOOLS} duplicate schools, ${DUPLICATE_CRIMES} duplicate crimes${NC}"
fi

# Check coordinate validity (Tokyo area: 139.5-140.0 E, 35.5-36.0 N)
INVALID_COORDS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc "SELECT COUNT(*) FROM schools WHERE ST_X(location) < 139.5 OR ST_X(location) > 140.0 OR ST_Y(location) < 35.5 OR ST_Y(location) > 36.0;")
if [ "$INVALID_COORDS" -eq 0 ]; then
    echo -e "${GREEN}All coordinates valid${NC}"
else
    echo -e "${RED}Warning: Found ${INVALID_COORDS} invalid coordinates${NC}"
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Data Growth:"
echo "  Wards: ${BASELINE_WARDS} -> ${RESULT_WARDS} (+$(($RESULT_WARDS - $BASELINE_WARDS)))"
echo "  Schools: ${BASELINE_SCHOOLS} -> ${RESULT_SCHOOLS} (+$(($RESULT_SCHOOLS - $BASELINE_SCHOOLS)))"
echo "  Crimes: ${BASELINE_CRIMES} -> ${RESULT_CRIMES} (+$(($RESULT_CRIMES - $BASELINE_CRIMES)))"
echo ""

if [ "$RESULT_WARDS" -gt "$BASELINE_WARDS" ] && [ "$SUMIDA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Priority 3 ETL Test - PASSED${NC}"
else
    echo -e "${RED}Priority 3 ETL Test - FAILED${NC}"
    exit 1
fi
echo ""

echo "Next steps:"
echo "1. Check Airflow UI: http://localhost:8082"
echo "2. Verify on frontend: http://localhost:3001"
echo "3. Check API: curl http://localhost:8081/api/schools?ward_code=13107"
echo "4. Run detailed verification: ./scripts/verify_data_quality.sh"
echo ""
