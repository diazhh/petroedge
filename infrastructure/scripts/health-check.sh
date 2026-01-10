#!/bin/bash

# Health Check Script for SCADA+ERP Edge Services
# Monitors all Docker services and reports their health status

set -e

echo "=========================================="
echo "SCADA+ERP Health Check Monitor"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service health
check_service_health() {
    local service=$1
    local container_name="scadaerp-${service}"
    
    echo -n "Checking ${service}... "
    
    # Check if container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${RED}✗ NOT FOUND${NC}"
        return 1
    fi
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${RED}✗ NOT RUNNING${NC}"
        return 1
    fi
    
    # Check health status
    health_status=$(docker inspect --format='{{.State.Health.Status}}' ${container_name} 2>/dev/null || echo "no-healthcheck")
    
    case "$health_status" in
        "healthy")
            echo -e "${GREEN}✓ HEALTHY${NC}"
            return 0
            ;;
        "unhealthy")
            echo -e "${RED}✗ UNHEALTHY${NC}"
            return 1
            ;;
        "starting")
            echo -e "${YELLOW}⟳ STARTING${NC}"
            return 2
            ;;
        "no-healthcheck")
            # For services without health check, just check if running
            echo -e "${BLUE}● RUNNING (no health check)${NC}"
            return 0
            ;;
        *)
            echo -e "${YELLOW}? UNKNOWN${NC}"
            return 3
            ;;
    esac
}

# Function to get detailed health info
get_health_details() {
    local service=$1
    local container_name="scadaerp-${service}"
    
    echo ""
    echo "=== ${service} Health Details ==="
    
    # Get health check logs
    health_log=$(docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' ${container_name} 2>/dev/null || echo "No health check configured")
    
    if [ "$health_log" != "No health check configured" ]; then
        echo "Last Health Check Output:"
        echo "$health_log" | tail -n 5
    else
        echo "No health check configured for this service"
    fi
    
    # Get container stats
    echo ""
    echo "Container Stats:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" ${container_name}
    
    echo ""
}

# Main health check
echo "1. Service Health Status"
echo "--------------------------------------"

services=("postgres" "zookeeper" "kafka" "redis" "grafana" "prometheus" "kafka-ui" "pgadmin")
healthy_count=0
unhealthy_count=0
starting_count=0
total_count=${#services[@]}

for service in "${services[@]}"; do
    check_service_health "$service"
    status=$?
    
    case $status in
        0) ((healthy_count++)) ;;
        1) ((unhealthy_count++)) ;;
        2) ((starting_count++)) ;;
    esac
done

echo ""

# Summary
echo "2. Health Summary"
echo "--------------------------------------"
echo -e "Total Services: ${total_count}"
echo -e "${GREEN}Healthy: ${healthy_count}${NC}"
echo -e "${RED}Unhealthy: ${unhealthy_count}${NC}"
echo -e "${YELLOW}Starting: ${starting_count}${NC}"

echo ""

# Overall status
if [ $unhealthy_count -eq 0 ] && [ $starting_count -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
    exit_code=0
elif [ $unhealthy_count -gt 0 ]; then
    echo -e "${RED}✗ Some services are unhealthy${NC}"
    exit_code=1
else
    echo -e "${YELLOW}⟳ Some services are still starting${NC}"
    exit_code=2
fi

echo ""

# Detailed info for unhealthy services
if [ $unhealthy_count -gt 0 ]; then
    echo "3. Unhealthy Service Details"
    echo "--------------------------------------"
    
    for service in "${services[@]}"; do
        container_name="scadaerp-${service}"
        health_status=$(docker inspect --format='{{.State.Health.Status}}' ${container_name} 2>/dev/null || echo "no-healthcheck")
        
        if [ "$health_status" = "unhealthy" ]; then
            get_health_details "$service"
        fi
    done
fi

# Check dependencies
echo "4. Service Dependencies"
echo "--------------------------------------"

# PostgreSQL
echo -n "PostgreSQL accepting connections... "
if docker exec scadaerp-postgres pg_isready -U scadaerp -q; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Redis
echo -n "Redis responding to PING... "
if docker exec scadaerp-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Kafka
echo -n "Kafka broker available... "
if docker exec scadaerp-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>&1 | grep -q "ApiVersion"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Zookeeper
echo -n "Zookeeper responding... "
if docker exec scadaerp-zookeeper nc -z localhost 2181 2>&1 | grep -q "succeeded"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""

# Resource usage
echo "5. Resource Usage"
echo "--------------------------------------"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep scadaerp

echo ""

# Recommendations
if [ $exit_code -ne 0 ]; then
    echo "=========================================="
    echo "Recommendations"
    echo "=========================================="
    echo ""
    
    if [ $unhealthy_count -gt 0 ]; then
        echo "• Check logs for unhealthy services:"
        echo "  docker-compose -f infrastructure/docker/docker-compose.dev.yml logs <service>"
        echo ""
        echo "• Restart unhealthy services:"
        echo "  docker-compose -f infrastructure/docker/docker-compose.dev.yml restart <service>"
        echo ""
    fi
    
    if [ $starting_count -gt 0 ]; then
        echo "• Wait for services to finish starting (30-60 seconds)"
        echo "• Re-run this script to check status"
        echo ""
    fi
    
    echo "• View real-time logs:"
    echo "  docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f"
    echo ""
fi

echo "=========================================="
echo "Health Check Complete"
echo "=========================================="

exit $exit_code
