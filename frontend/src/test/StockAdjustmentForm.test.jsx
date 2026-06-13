import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StockAdjustmentForm from '../components/StockAdjustmentForm';

describe('StockAdjustmentForm Component', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Widget',
    sku: 'TST-001',
    current_stock: 50,
  };

  const defaultProps = {
    product: mockProduct,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the product name and sku', () => {
    render(<StockAdjustmentForm {...defaultProps} />);
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    // SKU is rendered as "SKU: TST-001" inside a span
    expect(screen.getByText(/SKU: TST-001/)).toBeInTheDocument();
  });

  it('shows the current stock value', () => {
    render(<StockAdjustmentForm {...defaultProps} />);
    // Stock is rendered as <strong>50</strong> inside a span
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders both add and remove stock buttons', () => {
    render(<StockAdjustmentForm {...defaultProps} />);
    expect(screen.getByText('+ Add Stock')).toBeInTheDocument();
    expect(screen.getByText('− Remove Stock')).toBeInTheDocument();
  });

  it('renders reason dropdown with common reasons', () => {
    render(<StockAdjustmentForm {...defaultProps} />);
    expect(screen.getByText('New Shipment')).toBeInTheDocument();
    expect(screen.getByText('Sale')).toBeInTheDocument();
    expect(screen.getByText('Damage')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    expect(screen.getByText('Correction')).toBeInTheDocument();
  });

  it('calls onSubmit with positive change_amount for add stock', () => {
    const onSubmit = vi.fn();
    render(<StockAdjustmentForm {...defaultProps} onSubmit={onSubmit} />);

    // Enter quantity
    const amountInput = screen.getByPlaceholderText('Enter quantity');
    fireEvent.change(amountInput, { target: { value: '10' } });

    // Submit
    fireEvent.click(screen.getByText('Update Inventory'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        change_amount: 10,
        reason: 'New Shipment',
      })
    );
  });

  it('calls onSubmit with negative change_amount for remove stock', () => {
    const onSubmit = vi.fn();
    render(<StockAdjustmentForm {...defaultProps} onSubmit={onSubmit} />);

    // Switch to remove mode
    fireEvent.click(screen.getByText('− Remove Stock'));

    // Enter quantity
    const amountInput = screen.getByPlaceholderText('Enter quantity');
    fireEvent.change(amountInput, { target: { value: '5' } });

    // Change reason to Sale
    fireEvent.change(screen.getByDisplayValue('New Shipment'), {
      target: { value: 'Sale' },
    });

    // Submit
    fireEvent.click(screen.getByText('Update Inventory'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        change_amount: -5,
        reason: 'Sale',
      })
    );
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<StockAdjustmentForm {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('highlights the active stock adjustment type button', () => {
    render(<StockAdjustmentForm {...defaultProps} />);
    const addBtn = screen.getByText('+ Add Stock');
    const removeBtn = screen.getByText('− Remove Stock');

    // Click remove to switch
    fireEvent.click(removeBtn);

    // The remove button should now be active
    expect(removeBtn.className).toContain('apple-btn-danger');
    expect(addBtn.className).toContain('apple-btn-secondary');
  });
});