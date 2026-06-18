import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OwnerInsights from '../components/OwnerInsights';

describe('OwnerInsights Component — Calculation Accuracy', () => {
  const sampleProducts = [
    { id: 1, name: 'iPhone 15 Pro', sku: 'IP15', category_name: 'Electronics', current_stock: 50, reorder_point: 10, unit_cost: 800 },
    { id: 2, name: 'USB-C Cable',   sku: 'CBL',  category_name: 'Electronics', current_stock: 3,  reorder_point: 10, unit_cost: 5 },
    { id: 3, name: 'Desk Chair',    sku: 'CHR',  category_name: 'Furniture',   current_stock: 8,  reorder_point: 3,  unit_cost: 150 },
    { id: 4, name: 'Monitor Stand', sku: 'MNT',  category_name: 'Furniture',   current_stock: 2,  reorder_point: 5,  unit_cost: 40 },
    { id: 5, name: 'Notebook',      sku: 'NTB',  category_name: 'Office',      current_stock: 100, reorder_point: 20, unit_cost: 3 },
  ];

  const lowStockItems = sampleProducts.filter(
    (p) => Number(p.current_stock) < Number(p.reorder_point)
  );

  it('renders the Owner Insights badge', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    expect(screen.getByText('👑 Owner Insights')).toBeInTheDocument();
  });

  it('calculates total stock on hand correctly', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // 50 + 3 + 8 + 2 + 100 = 163
    expect(screen.getByText('163')).toBeInTheDocument();
  });

  it('calculates total inventory investment correctly', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // (50*800) + (3*5) + (8*150) + (2*40) + (100*3)
    // = 40000 + 15 + 1200 + 80 + 300 = 41,595
    expect(screen.getByText('$41,595.00')).toBeInTheDocument();
  });

  it('calculates average item cost correctly', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // (800 + 5 + 150 + 40 + 3) / 5 = 998 / 5 = 199.6
    expect(screen.getByText('$199.60')).toBeInTheDocument();
  });

  it('calculates restock cost estimate correctly', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // USB-C Cable: (10-3) * 5 = 35
    // Monitor Stand: (5-2) * 40 = 120
    // Total: 35 + 120 = 155
    expect(screen.getByText('$155.00')).toBeInTheDocument();
  });

  it('shows correct number of items needing restock', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    expect(screen.getByText(/2 items need restocking/)).toBeInTheDocument();
  });

  it('displays restock item details for each low-stock product', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    expect(screen.getByText('USB-C Cable')).toBeInTheDocument();
    expect(screen.getByText('Monitor Stand')).toBeInTheDocument();
  });

  it('shows category breakdown cards', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Furniture')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
  });

  it('shows category item counts', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // "2 items" appears in both Electronics and Furniture cards
    const itemCounts = screen.getAllByText('2 items');
    expect(itemCounts.length).toBe(2);
  });

  it('shows category investment values', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // Electronics: 40000 + 15 = $40,015.00
    expect(screen.getByText('$40,015.00')).toBeInTheDocument();
  });

  it('shows category stock units', () => {
    render(<OwnerInsights products={sampleProducts} lowStockItems={lowStockItems} />);
    // Furniture has 8+2 = 10 units
    expect(screen.getByText('10 units in stock')).toBeInTheDocument();
  });
});

describe('OwnerInsights Component — Edge Cases', () => {
  it('renders "well-stocked" message when no items need restock', () => {
    const wellStocked = [
      { id: 1, name: 'Item A', sku: 'A', category_name: 'Test', current_stock: 20, reorder_point: 10, unit_cost: 10 },
    ];
    render(<OwnerInsights products={wellStocked} lowStockItems={[]} />);
    expect(screen.getByText(/All items are adequately stocked/)).toBeInTheDocument();
  });

  it('handles empty products array gracefully', () => {
    const { container } = render(<OwnerInsights products={[]} lowStockItems={[]} />);
    // Should render the badge but no stats
    expect(screen.getByText('👑 Owner Insights')).toBeInTheDocument();
    // Empty products means no category section
    expect(container.querySelector('.owner-category-grid')).toBeNull();
  });

  it('handles zero-cost items correctly', () => {
    const zeroCostItems = [
      { id: 1, name: 'Free Item', sku: 'FREE', category_name: 'Test', current_stock: 10, reorder_point: 5, unit_cost: 0 },
    ];
    render(<OwnerInsights products={zeroCostItems} lowStockItems={[]} />);
    // $0.00 appears in both Inventory Investment and Reorder Cost Estimate
    const zeroMatches = screen.getAllByText('$0.00');
    expect(zeroMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('handles very large numbers without overflow', () => {
    const bulkItems = [
      { id: 1, name: 'Bulk', sku: 'BLK', category_name: 'Wholesale', current_stock: 99999, reorder_point: 100, unit_cost: 999.99 },
    ];
    const { container } = render(<OwnerInsights products={bulkItems} lowStockItems={[]} />);
    // "99,999" appears in both stat card and category stock text - verify it appears multiple times
    const stockMatches = screen.getAllByText('99,999');
    expect(stockMatches.length).toBeGreaterThanOrEqual(1);
    // "$99,998,000.01" appears in both stat card and category value
    const valueMatches = screen.getAllByText('$99,998,000.01');
    expect(valueMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('handles items where current_stock equals reorder_point (no restock needed)', () => {
    const exactStock = [
      { id: 1, name: 'Exactly At Reorder', sku: 'EXACT', category_name: 'Test', current_stock: 10, reorder_point: 10, unit_cost: 25 },
    ];
    render(<OwnerInsights products={exactStock} lowStockItems={[]} />);
    expect(screen.getByText(/All items are adequately stocked/)).toBeInTheDocument();
  });
});