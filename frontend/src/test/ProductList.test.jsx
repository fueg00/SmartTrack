import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductList from '../components/ProductList';

// Mock the api module at the top level
vi.mock('../api', () => ({
  default: {},
  getProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

import * as api from '../api';

describe('ProductList Component', () => {
  const mockCategories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Office Supplies' },
  ];

  const defaultProps = {
    categories: mockCategories,
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onAdjustStock: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // Return a promise that never resolves to keep loading state
    api.getProducts.mockReturnValue(new Promise(() => {}));

    render(<ProductList {...defaultProps} />);
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('renders empty state when no products', async () => {
    api.getProducts.mockResolvedValue({ data: [] });

    render(<ProductList {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/no products found/i)
      ).toBeInTheDocument();
    });
  });

  it('renders search input and category filter', () => {
    api.getProducts.mockResolvedValue({ data: [] });

    render(<ProductList {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/search name or sku/i)
    ).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
  });

  it('renders the add product button', () => {
    api.getProducts.mockResolvedValue({ data: [] });

    render(<ProductList {...defaultProps} />);
    expect(screen.getByText('+ Add Product')).toBeInTheDocument();
  });

  it('calls onAdd when add button is clicked', () => {
    const onAdd = vi.fn();
    api.getProducts.mockResolvedValue({ data: [] });

    render(<ProductList {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByText('+ Add Product'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('triggers search on input change', () => {
    api.getProducts.mockResolvedValue({ data: [] });

    render(<ProductList {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/search name or sku/i);
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });
    expect(searchInput.value).toBe('iPhone');
  });

  it('renders products in a table when data is returned', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'iPhone 15 Pro',
        sku: 'IP15-PM-256',
        category_name: 'Electronics',
        current_stock: 50,
        reorder_point: 10,
        unit_price: 999.99,
      },
      {
        id: 2,
        name: 'USB-C Cable',
        sku: 'CBL-USBC-2M',
        category_name: 'Electronics',
        current_stock: 3,
        reorder_point: 10,
        unit_price: 19.99,
      },
    ];

    api.getProducts.mockResolvedValue({ data: mockProducts });

    render(<ProductList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('USB-C Cable')).toBeInTheDocument();
      expect(screen.getByText('IP15-PM-256')).toBeInTheDocument();
    });
  });
});