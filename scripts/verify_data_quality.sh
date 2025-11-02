#!/bin/bash

# Data Quality Verification Script
# Validates data integrity for Priority 3 districts

set -e

echo "======================================"
echo "Data Quality Verification"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project directory
PROJECT_DIR="/Users/ota-eita/Documents/work/gokinjo"
cd "$PROJECT_DIR"

# Priority 3 districts
DISTRICTS=("13107" "13108" "13109" "13110")
DISTRICT_NAMES=("Sumida" "Koto" "Shinagawa" "Meguro")

# Check 1: District data completeness
echo "[Check 1] District Data Completeness"
echo "-------------------------------------"
for i in "${!DISTRICTS[@]}"; do
    WARD_CODE="${DISTRICTS[$i]}"
    DISTRICT_NAME="${DISTRICT_NAMES[$i]}"
    
    AREA_COUNT=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
        "SELECT COUNT(*) FROM areas WHERE ward_code = '${WARD_CODE}';")
    SCHOOL_COUNT=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
        "SELECT COUNT(*) FROM schools s JOIN areas a ON s.area_id = a.id WHERE a.ward_code = '${WARD_CODE}';")
    CRIME_COUNT=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
        "SELECT COUNT(*) FROM crimes c JOIN areas a ON c.area_id = a.id WHERE a.ward_code = '${WARD_CODE}';")
    
    echo "${DISTRICT_NAME} (${WARD_CODE}):"
    echo "  Areas: ${AREA_COUNT}"
    echo "  Schools: ${SCHOOL_COUNT}"
    echo "  Crimes: ${CRIME_COUNT}"
    
    if [ "$AREA_COUNT" -eq 0 ]; then
        echo -e "  ${RED}ERROR: No area data${NC}"
    elif [ "$SCHOOL_COUNT" -eq 0 ]; then
        echo -e "  ${YELLOW}WARNING: No school data${NC}"
    elif [ "$CRIME_COUNT" -eq 0 ]; then
        echo -e "  ${YELLOW}WARNING: No crime data${NC}"
    else
        echo -e "  ${GREEN}OK${NC}"
    fi
    echo ""
done

# Check 2: Coordinate validity
echo "[Check 2] Coordinate Validity"
echo "-------------------------------------"
INVALID_SCHOOL_COORDS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) FROM schools WHERE ST_X(location) < 139.5 OR ST_X(location) > 140.0 OR ST_Y(location) < 35.5 OR ST_Y(location) > 36.0;")
INVALID_CRIME_COORDS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) FROM crimes WHERE ST_X(location) < 139.5 OR ST_X(location) > 140.0 OR ST_Y(location) < 35.5 OR ST_Y(location) > 36.0;")

echo "Invalid school coordinates: ${INVALID_SCHOOL_COORDS}"
echo "Invalid crime coordinates: ${INVALID_CRIME_COORDS}"

if [ "$INVALID_SCHOOL_COORDS" -eq 0 ] && [ "$INVALID_CRIME_COORDS" -eq 0 ]; then
    echo -e "${GREEN}All coordinates valid${NC}"
else
    echo -e "${RED}WARNING: Found invalid coordinates${NC}"
fi
echo ""

# Check 3: Duplicate detection
echo "[Check 3] Duplicate Detection"
echo "-------------------------------------"
DUPLICATE_SCHOOLS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) - COUNT(DISTINCT location_hash) FROM schools;")
DUPLICATE_CRIMES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) - COUNT(DISTINCT location_hash) FROM crimes;")

echo "Duplicate schools: ${DUPLICATE_SCHOOLS}"
echo "Duplicate crimes: ${DUPLICATE_CRIMES}"

if [ "$DUPLICATE_SCHOOLS" -eq 0 ] && [ "$DUPLICATE_CRIMES" -eq 0 ]; then
    echo -e "${GREEN}No duplicates found${NC}"
else
    echo -e "${YELLOW}WARNING: Duplicates detected${NC}"
fi
echo ""

# Check 4: Foreign key integrity
echo "[Check 4] Foreign Key Integrity"
echo "-------------------------------------"
ORPHAN_SCHOOLS=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) FROM schools WHERE area_id NOT IN (SELECT id FROM areas);")
ORPHAN_CRIMES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) FROM crimes WHERE area_id NOT IN (SELECT id FROM areas);")

echo "Orphan schools: ${ORPHAN_SCHOOLS}"
echo "Orphan crimes: ${ORPHAN_CRIMES}"

if [ "$ORPHAN_SCHOOLS" -eq 0 ] && [ "$ORPHAN_CRIMES" -eq 0 ]; then
    echo -e "${GREEN}All foreign keys valid${NC}"
else
    echo -e "${RED}ERROR: Found orphan records${NC}"
fi
echo ""

# Check 5: Safety score calculation
echo "[Check 5] Safety Score Calculation"
echo "-------------------------------------"
NULL_SAFETY_SCORES=$(cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -tAc \
    "SELECT COUNT(*) FROM schools WHERE safety_score IS NULL;")

echo "Schools with null safety_score: ${NULL_SAFETY_SCORES}"

if [ "$NULL_SAFETY_SCORES" -eq 0 ]; then
    echo -e "${GREEN}All safety scores calculated${NC}"
else
    echo -e "${YELLOW}WARNING: Some schools missing safety scores${NC}"
fi
echo ""

# Check 6: Data distribution
echo "[Check 6] Data Distribution"
echo "-------------------------------------"
cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping << EOF
SELECT 
    ward_code,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE ward_code IN ('13107', '13108', '13109', '13110')
GROUP BY ward_code
ORDER BY ward_code;
EOF
echo ""

# Summary
echo "======================================"
echo "Verification Complete"
echo "======================================"
echo ""
echo "Next actions:"
echo "1. Review any warnings or errors above"
echo "2. Fix data quality issues if needed"
echo "3. Re-run ETL if necessary"
echo ""
