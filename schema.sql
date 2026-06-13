-- SmartTrack Complete Database Schema
-- Generated from codebase analysis of all backend SQL queries
-- Covers: organizations, users, categories, products, stock_transactions, referrals, beta_feedback

-- ============================================================
-- ORGANIZATIONS (tenant root — every user belongs to one)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_beta INTEGER DEFAULT 0,
    subscription_tier TEXT DEFAULT 'Free',
    trial_end_date DATETIME,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    referral_code TEXT
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Owner', 'Manager', 'Staff')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE(organization_id, name)
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category_id INTEGER,
    description TEXT,
    unit_price REAL NOT NULL,
    unit_cost REAL NOT NULL,
    reorder_point INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(organization_id, sku)
);

-- ============================================================
-- STOCK TRANSACTIONS (audit trail for stock changes)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    product_id INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================================
-- REFERRALS (referral tracking for organic growth)
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_org_id INTEGER,
    referred_org_id INTEGER,
    referral_code TEXT,
    reward_applied INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_org_id) REFERENCES organizations(id),
    FOREIGN KEY (referred_org_id) REFERENCES organizations(id)
);

-- ============================================================
-- BETA FEEDBACK (user-submitted feedback from beta testers)
-- ============================================================
CREATE TABLE IF NOT EXISTS beta_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER,
    user_id INTEGER,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    current_url TEXT,
    browser_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);