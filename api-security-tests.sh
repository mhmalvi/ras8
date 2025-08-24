#!/bin/bash

# ================================================================
# CRITICAL SECURITY AUDIT - API ENDPOINT TESTING SCRIPTS
# ================================================================
#
# These scripts test tenant isolation at the API layer.
# Replace tokens and URLs with your actual test environment values.
#
# WARNING: These tests may expose cross-tenant data vulnerabilities.
# Only run in a secure development environment.
#
# ================================================================

# Configuration - UPDATE THESE VALUES
BASE_URL="https://b6a2636f3576.ngrok-free.app"
TENANT_A_TOKEN="<REPLACE_WITH_ACTUAL_TOKEN_A>"
TENANT_B_TOKEN="<REPLACE_WITH_ACTUAL_TOKEN_B>"
MERCHANT_A_ID="<REPLACE_WITH_ACTUAL_MERCHANT_A_ID>"
MERCHANT_B_ID="<REPLACE_WITH_ACTUAL_MERCHANT_B_ID>"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================================"
echo "🔒 CRITICAL SECURITY AUDIT - API TENANT ISOLATION TESTS"
echo "================================================================"
echo ""
echo "⚠️  WARNING: This will test for tenant isolation vulnerabilities"
echo "    Only run in a secure development environment"
echo ""

# Helper function to make API calls and check responses
test_api_call() {
    local test_name="$1"
    local method="$2" 
    local endpoint="$3"
    local token="$4"
    local expected_status="$5"
    local description="$6"
    
    echo "🧪 Testing: $test_name"
    echo "   Description: $description"
    echo "   Endpoint: $method $endpoint"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nRESPONSE_TIME:%{time_total}" \
        -X "$method" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_time=$(echo "$response" | grep "RESPONSE_TIME:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d' | sed '/RESPONSE_TIME:/d')
    
    echo "   Status: $http_status (Expected: $expected_status)"
    echo "   Response Time: ${response_time}s"
    
    if [ "$http_status" = "$expected_status" ]; then
        echo -e "   Result: ${GREEN}✅ PASS${NC}"
    else
        echo -e "   Result: ${RED}❌ FAIL${NC}"
        echo "   Response: $response_body"
    fi
    
    echo "   Response Body Length: $(echo "$response_body" | wc -c) characters"
    echo "---"
    
    # Store response for further analysis
    echo "$response_body" > "/tmp/api_test_${test_name// /_}.json" 2>/dev/null
}

# ================================================================
# 1. AUTHENTICATION AND AUTHORIZATION TESTS
# ================================================================

echo -e "${BLUE}📋 Phase 1: Authentication & Authorization Tests${NC}"
echo ""

# Test 1: Unauthenticated access should be rejected
test_api_call \
    "Unauthenticated Access" \
    "GET" \
    "/api/products" \
    "" \
    "401" \
    "Verify unauthenticated requests are rejected"

# Test 2: Invalid token should be rejected  
test_api_call \
    "Invalid Token" \
    "GET" \
    "/api/products" \
    "invalid-token-12345" \
    "401" \
    "Verify invalid tokens are rejected"

# Test 3: Valid token should work
test_api_call \
    "Valid Token A" \
    "GET" \
    "/api/products" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Verify valid token A works"

test_api_call \
    "Valid Token B" \
    "GET" \
    "/api/products" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Verify valid token B works"

# ================================================================
# 2. TENANT ISOLATION TESTS
# ================================================================

echo -e "${BLUE}📋 Phase 2: Tenant Data Isolation Tests${NC}"
echo ""

# Test 4: Products endpoint tenant isolation
test_api_call \
    "Products Tenant A" \
    "GET" \
    "/api/products?limit=10" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Fetch products for tenant A - should only return A's products"

test_api_call \
    "Products Tenant B" \
    "GET" \
    "/api/products?limit=10" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Fetch products for tenant B - should only return B's products"

# Test 5: Orders endpoint tenant isolation
test_api_call \
    "Orders Tenant A" \
    "GET" \
    "/api/orders?limit=10" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Fetch orders for tenant A - should only return A's orders"

test_api_call \
    "Orders Tenant B" \
    "GET" \
    "/api/orders?limit=10" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Fetch orders for tenant B - should only return B's orders"

# Test 6: Returns endpoint tenant isolation
test_api_call \
    "Returns Tenant A" \
    "GET" \
    "/api/returns?limit=10" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Fetch returns for tenant A - should only return A's returns"

test_api_call \
    "Returns Tenant B" \
    "GET" \
    "/api/returns?limit=10" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Fetch returns for tenant B - should only return B's returns"

# Test 7: Customers endpoint tenant isolation
test_api_call \
    "Customers Tenant A" \
    "GET" \
    "/api/customers?limit=10" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Fetch customers for tenant A - should only return A's customers"

test_api_call \
    "Customers Tenant B" \
    "GET" \
    "/api/customers?limit=10" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Fetch customers for tenant B - should only return B's customers"

# ================================================================
# 3. DASHBOARD AND ANALYTICS ISOLATION
# ================================================================

echo -e "${BLUE}📋 Phase 3: Dashboard & Analytics Isolation Tests${NC}"
echo ""

# Test 8: Dashboard summary isolation
test_api_call \
    "Dashboard Summary A" \
    "GET" \
    "/api/dashboard/summary" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Dashboard summary for tenant A - should only include A's metrics"

test_api_call \
    "Dashboard Summary B" \
    "GET" \
    "/api/dashboard/summary" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Dashboard summary for tenant B - should only include B's metrics"

# Test 9: Analytics endpoints isolation
test_api_call \
    "Analytics Events A" \
    "GET" \
    "/api/analytics/events?limit=20" \
    "$TENANT_A_TOKEN" \
    "200" \
    "Analytics events for tenant A - should only return A's events"

test_api_call \
    "Analytics Events B" \
    "GET" \
    "/api/analytics/events?limit=20" \
    "$TENANT_B_TOKEN" \
    "200" \
    "Analytics events for tenant B - should only return B's events"

# Test 10: AI insights isolation
test_api_call \
    "AI Insights A" \
    "GET" \
    "/api/ai/insights" \
    "$TENANT_A_TOKEN" \
    "200" \
    "AI insights for tenant A - should only analyze A's data"

test_api_call \
    "AI Insights B" \
    "GET" \
    "/api/ai/insights" \
    "$TENANT_B_TOKEN" \
    "200" \
    "AI insights for tenant B - should only analyze B's data"

# ================================================================
# 4. CROSS-TENANT ACCESS ATTEMPTS (Should ALL FAIL)
# ================================================================

echo -e "${BLUE}📋 Phase 4: Cross-Tenant Access Violation Tests${NC}"
echo -e "${YELLOW}⚠️  All tests in this section should FAIL (403/404) to be secure${NC}"
echo ""

# Test 11: Attempt to access other tenant's merchant data
test_api_call \
    "Cross-Tenant Merchant Access" \
    "GET" \
    "/api/merchants/$MERCHANT_B_ID" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Tenant A trying to access Tenant B's merchant data - should be FORBIDDEN"

# Test 12: Attempt to access other tenant's specific resources
test_api_call \
    "Cross-Tenant Product Access" \
    "GET" \
    "/api/merchants/$MERCHANT_B_ID/products" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Tenant A trying to access Tenant B's products - should be FORBIDDEN"

test_api_call \
    "Cross-Tenant Order Access" \
    "GET" \
    "/api/merchants/$MERCHANT_B_ID/orders" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Tenant A trying to access Tenant B's orders - should be FORBIDDEN"

# Test 13: Attempt to modify other tenant's data
test_api_call \
    "Cross-Tenant Data Modification" \
    "POST" \
    "/api/merchants/$MERCHANT_B_ID/returns" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Tenant A trying to create returns for Tenant B - should be FORBIDDEN"

# ================================================================
# 5. ADMIN AND PRIVILEGED ENDPOINT TESTS
# ================================================================

echo -e "${BLUE}📋 Phase 5: Admin & Privileged Endpoint Tests${NC}"
echo ""

# Test 14: Master admin endpoints (if they exist)
test_api_call \
    "Master Admin Access A" \
    "GET" \
    "/api/admin/merchants" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Regular tenant trying to access admin endpoints - should be FORBIDDEN"

test_api_call \
    "Master Admin Access B" \
    "GET" \
    "/api/admin/analytics" \
    "$TENANT_B_TOKEN" \
    "403" \
    "Regular tenant trying to access admin analytics - should be FORBIDDEN"

# Test 15: System health endpoints
test_api_call \
    "System Health Access" \
    "GET" \
    "/api/system/health" \
    "$TENANT_A_TOKEN" \
    "403" \
    "Regular tenant trying to access system health - should be FORBIDDEN or LIMITED"

# ================================================================
# 6. WEBHOOK AND INTEGRATION ENDPOINTS
# ================================================================

echo -e "${BLUE}📋 Phase 6: Webhook & Integration Security Tests${NC}"
echo ""

# Test 16: Webhook endpoints without proper authentication
test_api_call \
    "Webhook No Auth" \
    "POST" \
    "/api/webhooks/shopify" \
    "" \
    "401" \
    "Webhook without authentication - should be rejected"

# Test 17: Webhook with wrong signature (if HMAC validation exists)
test_api_call \
    "Webhook Invalid Signature" \
    "POST" \
    "/api/webhooks/shopify" \
    "$TENANT_A_TOKEN" \
    "401" \
    "Webhook with invalid signature - should be rejected"

# ================================================================
# 7. RESPONSE ANALYSIS AND COMPARISON
# ================================================================

echo -e "${BLUE}📋 Phase 7: Response Analysis${NC}"
echo ""

echo "🔍 Analyzing API responses for tenant isolation..."

# Compare response data between tenants
if [ -f "/tmp/api_test_Products_Tenant_A.json" ] && [ -f "/tmp/api_test_Products_Tenant_B.json" ]; then
    echo ""
    echo "📊 Product Data Comparison:"
    
    products_a_count=$(jq '. | length' /tmp/api_test_Products_Tenant_A.json 2>/dev/null || echo "Parse Error")
    products_b_count=$(jq '. | length' /tmp/api_test_Products_Tenant_B.json 2>/dev/null || echo "Parse Error")
    
    echo "   Tenant A Products: $products_a_count"
    echo "   Tenant B Products: $products_b_count"
    
    if [ "$products_a_count" = "$products_b_count" ] && [ "$products_a_count" != "0" ]; then
        echo -e "   ${YELLOW}⚠️  WARNING: Same product count might indicate data leakage${NC}"
    fi
    
    # Check for overlapping product IDs
    if command -v jq >/dev/null 2>&1; then
        echo "   Checking for overlapping product IDs..."
        
        # Extract product IDs from both responses
        jq -r '.[].id' /tmp/api_test_Products_Tenant_A.json 2>/dev/null | sort > /tmp/products_a_ids.txt
        jq -r '.[].id' /tmp/api_test_Products_Tenant_B.json 2>/dev/null | sort > /tmp/products_b_ids.txt
        
        # Find common IDs
        common_ids=$(comm -12 /tmp/products_a_ids.txt /tmp/products_b_ids.txt 2>/dev/null | wc -l)
        
        if [ "$common_ids" -gt 0 ]; then
            echo -e "   ${RED}🚨 CRITICAL: $common_ids overlapping product IDs found - DATA LEAKAGE DETECTED${NC}"
        else
            echo -e "   ${GREEN}✅ No overlapping product IDs found${NC}"
        fi
        
        # Clean up temp files
        rm -f /tmp/products_a_ids.txt /tmp/products_b_ids.txt 2>/dev/null
    fi
fi

# Similar analysis for dashboard summaries
if [ -f "/tmp/api_test_Dashboard_Summary_A.json" ] && [ -f "/tmp/api_test_Dashboard_Summary_B.json" ]; then
    echo ""
    echo "📊 Dashboard Summary Comparison:"
    
    if command -v jq >/dev/null 2>&1; then
        total_orders_a=$(jq -r '.total_orders // .orders_count // 0' /tmp/api_test_Dashboard_Summary_A.json 2>/dev/null)
        total_orders_b=$(jq -r '.total_orders // .orders_count // 0' /tmp/api_test_Dashboard_Summary_B.json 2>/dev/null)
        
        echo "   Tenant A Total Orders: $total_orders_a"
        echo "   Tenant B Total Orders: $total_orders_b"
        
        if [ "$total_orders_a" = "$total_orders_b" ] && [ "$total_orders_a" != "0" ]; then
            echo -e "   ${YELLOW}⚠️  WARNING: Identical order counts might indicate aggregated data${NC}"
        fi
    fi
fi

# ================================================================
# 8. SECURITY SUMMARY REPORT
# ================================================================

echo ""
echo "================================================================"
echo -e "${BLUE}🔒 SECURITY TEST SUMMARY${NC}"
echo "================================================================"
echo ""

# Count test results
total_tests=$(ls /tmp/api_test_*.json 2>/dev/null | wc -l)
echo "📊 Total API Tests Executed: $total_tests"

echo ""
echo "🔍 Key Security Checks:"
echo "   ✅ Authentication rejection tests"
echo "   ✅ Tenant data isolation verification"  
echo "   ✅ Cross-tenant access violation tests"
echo "   ✅ Privileged endpoint protection tests"
echo "   ✅ Response data overlap analysis"

echo ""
echo "📁 Test Response Files:"
echo "   Saved to: /tmp/api_test_*.json"
echo "   Review these files for detailed response analysis"

echo ""
echo -e "${YELLOW}⚠️  CRITICAL FINDINGS TO INVESTIGATE:${NC}"
echo "   • Any 200 responses to cross-tenant access attempts"
echo "   • Identical data counts between different tenants"
echo "   • Overlapping IDs in tenant-specific responses"
echo "   • Missing authentication on protected endpoints"
echo "   • Detailed error messages that leak system information"

echo ""
echo "🚨 If any cross-tenant access tests returned 200 OK:"
echo "   THIS IS A CRITICAL SECURITY VULNERABILITY"
echo "   Immediate remediation required!"

echo ""
echo "🔗 Next Steps:"
echo "   1. Review all FAIL results above"
echo "   2. Analyze response files in /tmp/api_test_*.json"
echo "   3. Run the SQL tests: psql -f security-repro-scripts.sql"
echo "   4. Implement fixes for any identified vulnerabilities"
echo "   5. Re-run tests to verify fixes"

echo ""
echo "================================================================"
echo "🏁 API Security Audit Complete"
echo "================================================================"

# Clean up function
cleanup() {
    echo ""
    echo "🧹 Cleaning up temporary files..."
    rm -f /tmp/api_test_*.json 2>/dev/null
    rm -f /tmp/products_*_ids.txt 2>/dev/null
    echo "   Cleanup complete"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

echo ""
echo -e "${GREEN}✅ API security audit completed successfully${NC}"
echo "Review the results above for any security vulnerabilities."