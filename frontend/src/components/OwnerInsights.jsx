import React from 'react';

function OwnerInsights({ products, lowStockItems }) {
  // ── Calculate Owner-level metrics ──────────────────────────────
  const totalStockOnHand = products.reduce(
    (sum, p) => sum + (Number(p.current_stock) || 0),
    0
  );

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (Number(p.current_stock) || 0) * (Number(p.unit_cost) || 0),
    0
  );

  const averageItemCost =
    products.length > 0
      ? products.reduce(
          (sum, p) => sum + (Number(p.unit_cost) || 0),
          0
        ) / products.length
      : 0;

  // Restock cost: bring low-stock items back to their reorder_point
  const restockCost = products.reduce((sum, p) => {
    const stock = Number(p.current_stock) || 0;
    const reorder = Number(p.reorder_point) || 0;
    const cost = Number(p.unit_cost) || 0;
    if (stock < reorder) {
      return sum + (reorder - stock) * cost;
    }
    return sum;
  }, 0);

  // Items needing restock
  const itemsNeedingRestock = products.filter((p) => {
    const stock = Number(p.current_stock) || 0;
    const reorder = Number(p.reorder_point) || 0;
    return stock < reorder;
  });

  // Category breakdown
  const categoryBreakdown = products.reduce((acc, p) => {
    const cat = p.category_name || 'Uncategorized';
    if (!acc[cat]) {
      acc[cat] = { count: 0, value: 0, stock: 0 };
    }
    acc[cat].count += 1;
    acc[cat].stock += Number(p.current_stock) || 0;
    acc[cat].value +=
      (Number(p.current_stock) || 0) * (Number(p.unit_cost) || 0);
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b.value - a.value
  );

  // ── Format helpers ─────────────────────────────────────────────
  const fmtCurrency = (n) =>
    '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtNumber = (n) => Number(n).toLocaleString('en-US');

  return (
    <div className="owner-insights">
      {/* Section Header */}
      <div className="owner-insights-header">
        <div className="owner-insights-badge">👑 Owner Insights</div>
        <div className="owner-insights-subtitle">
          Exclusive financial overview for the business owner
        </div>
      </div>

      {/* Primary Metric Cards */}
      <div className="owner-stats-grid">
        <div className="apple-card owner-stat-card">
          <div className="owner-stat-icon">📦</div>
          <div className="owner-stat-label">Total Stock on Hand</div>
          <div className="owner-stat-value">{fmtNumber(totalStockOnHand)}</div>
          <div className="owner-stat-delta">units across {products.length} products</div>
        </div>

        <div className="apple-card owner-stat-card">
          <div className="owner-stat-icon">💰</div>
          <div className="owner-stat-label">Inventory Investment</div>
          <div className="owner-stat-value">{fmtCurrency(totalInventoryValue)}</div>
          <div className="owner-stat-delta">Total cost basis</div>
        </div>

        <div className="apple-card owner-stat-card">
          <div className="owner-stat-icon">📊</div>
          <div className="owner-stat-label">Average Item Cost</div>
          <div className="owner-stat-value">{fmtCurrency(averageItemCost)}</div>
          <div className="owner-stat-delta">Per unit across catalog</div>
        </div>
      </div>

      {/* Restock & Reorder Estimates */}
      <div className="owner-restock-section">
        <div className="apple-card owner-restock-card">
          <div className="owner-restock-header">
            <div className="owner-restock-title">🔄 Reorder Cost Estimate</div>
            <div className="owner-restock-value">{fmtCurrency(restockCost)}</div>
          </div>
          <div className="owner-restock-body">
            {itemsNeedingRestock.length === 0 ? (
              <div className="owner-restock-status ok">All items are adequately stocked ✓</div>
            ) : (
              <>
                <div className="owner-restock-status warn">
                  {itemsNeedingRestock.length} item{itemsNeedingRestock.length !== 1 ? 's' : ''} need{' '}
                  restocking
                </div>
                <div className="owner-restock-list">
                  {itemsNeedingRestock.slice(0, 5).map((item) => {
                    const stock = Number(item.current_stock) || 0;
                    const reorder = Number(item.reorder_point) || 0;
                    const cost = Number(item.unit_cost) || 0;
                    const qtyNeeded = reorder - stock;
                    const itemCost = qtyNeeded * cost;
                    return (
                      <div key={item.id} className="owner-restock-item">
                        <div className="owner-restock-item-name">{item.name}</div>
                        <div className="owner-restock-item-detail">
                          {fmtNumber(qtyNeeded)} × {fmtCurrency(cost)} = {fmtCurrency(itemCost)}
                        </div>
                      </div>
                    );
                  })}
                  {itemsNeedingRestock.length > 5 && (
                    <div className="owner-restock-more">
                      +{itemsNeedingRestock.length - 5} more items
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryEntries.length > 0 && (
        <div>
          <div className="owner-section-subtitle">Category Breakdown</div>
          <div className="owner-category-grid">
            {categoryEntries.map(([catName, data]) => (
              <div key={catName} className="apple-card owner-category-card">
                <div className="owner-category-name">{catName}</div>
                <div className="owner-category-stat">
                  <span className="owner-category-count">{data.count} items</span>
                  <span className="owner-category-value">{fmtCurrency(data.value)}</span>
                </div>
                <div className="owner-category-bar">
                  <div
                    className="owner-category-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (data.value / totalInventoryValue) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="owner-category-stock">
                  {fmtNumber(data.stock)} units in stock
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerInsights;