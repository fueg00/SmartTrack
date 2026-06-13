import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductForm from '../components/ProductForm';

describe('ProductForm Component', () => {
  const mockCategories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Office Supplies' },
  ];

  const defaultProps = {
    title: 'Add Product',
    categories: mockCategories,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the add product form with title', () => {
    render(<ProductForm {...defaultProps} />);
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<ProductForm {...defaultProps} />);
    // Use getAllByText since "Category" matches both label and option text
    expect(screen.getAllByText(/product name/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/sku/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/category/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/unit price/i)).toBeInTheDocument();
    expect(screen.getByText(/unit cost/i)).toBeInTheDocument();
    expect(screen.getByText(/reorder point/i)).toBeInTheDocument();
  });

  it('renders all category options from props', () => {
    render(<ProductForm {...defaultProps} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
  });

  it('calls onSubmit with form data when submitted', () => {
    const onSubmit = vi.fn();
    render(<ProductForm {...defaultProps} onSubmit={onSubmit} />);

    // Use getByPlaceholderText which matches input elements
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. iPhone/i), {
      target: { name: 'name', value: 'Test Widget' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. IP15/i), {
      target: { name: 'sku', value: 'TST-001' },
    });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { name: 'unit_price', value: '19.99' },
    });

    fireEvent.click(screen.getByText('Save Product'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Widget',
        sku: 'TST-001',
      })
    );
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ProductForm {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pre-fills form when editing an existing product', () => {
    const product = {
      name: 'Existing Product',
      sku: 'EXIST-001',
      category_id: 1,
      description: 'Test description',
      unit_price: 49.99,
      unit_cost: 25.00,
      reorder_point: 10,
    };

    render(
      <ProductForm
        {...defaultProps}
        title="Edit Product"
        product={product}
      />
    );

    expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXIST-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('49.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
});