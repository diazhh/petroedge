#!/bin/bash

# Network Testing Script for SCADA+ERP Edge Services
# Tests connectivity between all Docker services

set -e

echo "=========================================="
echo "SCADA+ERP Network Connectivity Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test connectivity
test_connection() {
    local service=$1
    local target=$2
    local port=$3
    
    echo -n "Testing ${service} -> ${target}:${port}... "
    
    if docker exec scadaerp-${service} nc -zv ${target} ${port} 2>&1 | grep -q "succeeded"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to test DNS resolution
test_dns() {
    local service=$1
    local target=$2
    
    echo -n "Testing DNS resolution from ${service} to ${target}... "
    
    if docker exec scadaerp-${service} nslookup ${target} 2>&1 | grep -q "Address"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check if services are running
echo "1. Checking if services are running..."
echo "--------------------------------------"

services=("postgres" "zookeeper" "kafka" "redis" "grafana" "prometheus" "kafka-ui" "pgadmin")
all_running=true

for service in "${services[@]}"; do
    if docker ps | grep -q "scadaerp-${service}"; then
        echo -e "${GREEN}✓${NC} ${service} is running"
    else
        echo -e "${RED}✗${NC} ${service} is NOT running"
        all_running=false
    fi
done

echo ""

if [ "$all_running" = false ]; then
    echo -e "${RED}ERROR: Not all services are running. Please start them first:${NC}"
    echo "cd infrastructure/docker && docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

# Test DNS resolution
echo "2. Testing DNS Resolution..."
echo "--------------------------------------"

test_dns "postgres" "kafka"
test_dns "postgres" "redis"
test_dns "postgres" "zookeeper"
test_dns "kafka" "postgres"
test_dns "kafka" "zookeeper"
test_dns "redis" "postgres"

echo ""

# Test network connectivity
echo "3. Testing Network Connectivity..."
echo "--------------------------------------"

# PostgreSQL connections
test_connection "kafka" "postgres" "5432"
test_connection "grafana" "postgres" "5432"
test_connection "pgadmin" "postgres" "5432"

# Kafka connections
test_connection "kafka" "zookeeper" "2181"
test_connection "kafka-ui" "kafka" "29092"

# Redis connections
test_connection "postgres" "redis" "6379"

# Prometheus connections
test_connection "prometheus" "postgres" "5432"
test_connection "grafana" "prometheus" "9090"

echo ""

# Test service health
echo "4. Testing Service Health..."
echo "--------------------------------------"

# PostgreSQL health
echo -n "PostgreSQL health check... "
if docker exec scadaerp-postgres pg_isready -U scadaerp | grep -q "accepting connections"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Redis health
echo -n "Redis health check... "
if docker exec scadaerp-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Kafka health (check if broker is responding)
echo -n "Kafka health check... "
if docker exec scadaerp-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>&1 | grep -q "ApiVersion"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

echo ""

# Test network information
echo "5. Network Information..."
echo "--------------------------------------"

echo "Network: scadaerp-network"
docker network inspect scadaerp_scadaerp-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'

echo ""

# Summary
echo "=========================================="
echo "Network Test Complete"
echo "=========================================="
echo ""
echo -e "${YELLOW}Note:${NC} If any tests failed, check:"
echo "  1. All services are running: docker-compose ps"
echo "  2. Service logs: docker-compose logs <service>"
echo "  3. Network exists: docker network ls"
echo "  4. Firewall rules are not blocking connections"
echo ""
