#!/bin/bash
# SmartTrack API Integration Test Suite
# Tests all CRUD endpoints for inventory management
# Usage: bash test-api.sh
# Prerequisites: A running SmartTrack API (defaults to localhost:3001, override with API_BASE_URL)

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
PASS=0
FAIL=0
TEST_ORG="TestOrg-$(date +%s)"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
JWT=""

green() { echo -e "\033[32m✓ $1\033[0m"; }
red() { echo -e "\033[31m✗ $1\033[0m"; }
header() { echo -e "\n\033[36m━━━ $1 ━━━\033[0m"; }

record() {
  if [ "$1" = "ok" ]; then
    ((PASS++))
  else
    ((FAIL++))
  fi
}

# ───────────────────────────────────────────────────
header "1. Health Check"
# ───────────────────────────────────────────────────
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/health")
if [ "$RESP" = "200" ]; then
  green "Health endpoint returned 200"
  record ok
else
  red "Health endpoint failed (HTTP $RESP)"
  record fail
fi

# Check health response body
BODY=$(curl -s "$API_BASE_URL/api/health")
if echo "$BODY" | grep -q '"status":"ok"'; then
  green "Health body contains {\"status\":\"ok\"}"
  record ok
else
  red "Health body unexpected: $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "2. User Registration"
# ───────────────────────────────────────────────────
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"orgName\":\"$TEST_ORG\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  green "Registration succeeded (HTTP 201)"
  record ok
else
  # Registration might fail if org already existed, that's ok for re-runs
  red "Registration HTTP $HTTP_CODE: $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "3. User Login"
# ───────────────────────────────────────────────────
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  JWT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
  green "Login succeeded (HTTP 200, token received)"
  record ok
else
  red "Login failed (HTTP $HTTP_CODE): $BODY"
  record fail
fi

if [ -z "$JWT" ]; then
  red "No JWT token received — cannot proceed with authenticated tests"
  exit 1
fi

# Helper function for authenticated requests
AUTH() {
  curl -s -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" "$@"
}

# ───────────────────────────────────────────────────
header "4. List Categories"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/categories")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
CATEGORY_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "$HTTP_CODE" = "200" ] && [ "$CATEGORY_COUNT" -gt 0 ]; then
  green "Categories listed: $CATEGORY_COUNT default categories found"
  record ok
else
  red "Categories endpoint HTTP $HTTP_CODE: $BODY"
  record fail
fi

# Get the first category ID for use in product creation
CATEGORY_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null || echo "1")

# ───────────────────────────────────────────────────
header "5. Create Product (C)"
# ───────────────────────────────────────────────────
TIMESTAMP=$(date +%s)
PRODUCT_NAME="Test Product $TIMESTAMP"
PRODUCT_SKU="TST-$TIMESTAMP"

RESP=$(AUTH -w "\n%{http_code}" -X POST "$API_BASE_URL/api/products" \
  -d "{\"name\":\"$PRODUCT_NAME\",\"sku\":\"$PRODUCT_SKU\",\"category_id\":$CATEGORY_ID,\"description\":\"Test description\",\"unit_price\":29.99,\"unit_cost\":15.00,\"reorder_point\":10}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  green "Product created successfully (HTTP 201)"
  record ok
else
  red "Product creation failed (HTTP $HTTP_CODE): $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "6. List Products (R)"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/products")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
PRODUCT_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "$HTTP_CODE" = "200" ] && [ "$PRODUCT_COUNT" -gt 0 ]; then
  green "Products listed: $PRODUCT_COUNT items"
  record ok
else
  red "Products list failed (HTTP $HTTP_CODE): $(echo $BODY | head -c 200)"
  record fail
fi

# Get the product ID we just created
PRODUCT_ID=$(echo "$BODY" | python3 -c "
import sys,json
products = json.load(sys.stdin)
for p in products:
    if p['name'] == '$PRODUCT_NAME':
        print(p['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
  red "Could not find created product in list"
  record fail
  PRODUCT_ID="1"
fi

# ───────────────────────────────────────────────────
header "7. Get Single Product (R)"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/products/$PRODUCT_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  RETRIEVED_NAME=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])" 2>/dev/null || echo "")
  if [ "$RETRIEVED_NAME" = "$PRODUCT_NAME" ]; then
    green "Single product retrieved: '$RETRIEVED_NAME'"
    record ok
  else
    red "Product name mismatch: expected '$PRODUCT_NAME', got '$RETRIEVED_NAME'"
    record fail
  fi
else
  red "Get product failed (HTTP $HTTP_CODE): $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "8. Search Products (R with filter)"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/products?search=$TIMESTAMP")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
SEARCH_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "$HTTP_CODE" = "200" ] && [ "$SEARCH_COUNT" -eq 1 ]; then
  green "Search returned exactly 1 matching product"
  record ok
else
  red "Search returned $SEARCH_COUNT products (expected 1)"
  record fail
fi

# ───────────────────────────────────────────────────
header "9. Update Product (U)"
# ───────────────────────────────────────────────────
UPDATED_NAME="$PRODUCT_NAME - Updated"
RESP=$(AUTH -w "\n%{http_code}" -X PUT "$API_BASE_URL/api/products/$PRODUCT_ID" \
  -d "{\"name\":\"$UPDATED_NAME\",\"sku\":\"$PRODUCT_SKU\",\"category_id\":$CATEGORY_ID,\"description\":\"Updated description\",\"unit_price\":39.99,\"unit_cost\":20.00,\"reorder_point\":5}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  # Verify update was persisted
  VERIFY=$(AUTH "$API_BASE_URL/api/products/$PRODUCT_ID")
  VERIFIED_NAME=$(echo "$VERIFY" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])" 2>/dev/null || echo "")
  if [ "$VERIFIED_NAME" = "$UPDATED_NAME" ]; then
    green "Product updated and verified: '$VERIFIED_NAME'"
    record ok
  else
    red "Update verification failed: expected '$UPDATED_NAME', got '$VERIFIED_NAME'"
    record fail
  fi
else
  red "Update failed (HTTP $HTTP_CODE): $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "10. Adjust Stock (U — stock count)"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" -X POST "$API_BASE_URL/api/stock-adjustments" \
  -d "{\"product_id\":$PRODUCT_ID,\"change_amount\":25,\"reason\":\"New Shipment\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
  # Verify stock was adjusted
  VERIFY=$(AUTH "$API_BASE_URL/api/products/$PRODUCT_ID")
  STOCK=$(echo "$VERIFY" | python3 -c "import sys,json; print(json.load(sys.stdin)['current_stock'])" 2>/dev/null || echo "0")
  if [ "$STOCK" = "25" ]; then
    green "Stock adjusted to $STOCK — correct"
    record ok
  else
    red "Stock level unexpected: got $STOCK (expected 25)"
    record fail
  fi
else
  red "Stock adjustment failed (HTTP $HTTP_CODE): $(echo $RESP | head -c 200)"
  record fail
fi

# ───────────────────────────────────────────────────
header "11. Dashboard Stats"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/dashboard/stats")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  TOTAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['totalProducts'])" 2>/dev/null || echo "0")
  VALUE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['inventoryValue'])" 2>/dev/null || echo "0")
  LOW_STOCK=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['lowStockCount'])" 2>/dev/null || echo "0")
  green "Dashboard stats: $TOTAL products, \$$VALUE value, $LOW_STOCK low stock"
  record ok
else
  red "Dashboard stats failed (HTTP $HTTP_CODE): $BODY"
  record fail
fi

# ───────────────────────────────────────────────────
header "12. Low Stock Alerts"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" "$API_BASE_URL/api/dashboard/low-stock")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
  green "Low stock alerts endpoint works"
  record ok
else
  red "Low stock alerts failed (HTTP $HTTP_CODE): $(echo $RESP | head -c 100)"
  record fail
fi

# ───────────────────────────────────────────────────
header "13. Delete Product (D)"
# ───────────────────────────────────────────────────
RESP=$(AUTH -w "\n%{http_code}" -X DELETE "$API_BASE_URL/api/products/$PRODUCT_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
  # Verify deletion
  VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $JWT" "$API_BASE_URL/api/products/$PRODUCT_ID")
  if [ "$VERIFY_CODE" = "404" ]; then
    green "Product deleted and returns 404 on get"
    record ok
  else
    red "Deleted product still accessible (HTTP $VERIFY_CODE)"
    record fail
  fi
else
  red "Delete failed (HTTP $HTTP_CODE): $(echo $RESP | head -c 100)"
  record fail
fi

# ───────────────────────────────────────────────────
header "14. Authorization Enforcement"
# ───────────────────────────────────────────────────
# Request without auth token
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/products")
if [ "$RESP" = "401" ]; then
  green "Unauthenticated request correctly rejected (401)"
  record ok
else
  red "Unauthenticated request returned HTTP $RESP (expected 401)"
  record fail
fi

# ───────────────────────────────────────────────────
header "━━━ RESULTS ━━━"
echo -e "Passed: $PASS | Failed: $FAIL | Total: $((PASS+FAIL))"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\033[31mSome tests failed!\033[0m"
  exit 1
else
  echo -e "\033[32mAll tests passed!\033[0m"
fi
