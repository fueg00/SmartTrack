-- ============================================================
-- SUPPLIERS (vendor management for restock planning)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    lead_time_days INTEGER DEFAULT 7,
    payment_terms TEXT DEFAULT 'Net 30',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE(organization_id, name)
);

-- Add supplier_id to products
ALTER TABLE products ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id);