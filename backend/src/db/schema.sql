-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enums
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE campaign_type AS ENUM ('stamp', 'points', 'cashback');
CREATE TYPE transaction_type AS ENUM ('earn', 'redeem', 'expire', 'adjust');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked');

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS loyalty_campaigns CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- Merchants table with essential columns
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Campaigns table
CREATE TABLE loyalty_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type campaign_type NOT NULL DEFAULT 'stamp',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status campaign_status DEFAULT 'draft',
    points_ratio DECIMAL(10,2) DEFAULT 1.0, -- points per currency unit
    minimum_points_redeem INTEGER DEFAULT 0,
    campaign_config JSONB NOT NULL, -- Stores flexible campaign rules and settings
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status customer_status DEFAULT 'active',
    birth_date DATE,
    address JSONB,
    total_points INTEGER DEFAULT 0,
    tier_level VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, email),
    UNIQUE(merchant_id, phone)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES loyalty_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    points_amount INTEGER NOT NULL,
    currency_amount DECIMAL(10,2),
    reference_number VARCHAR(100),
    metadata JSONB, -- Stores additional transaction details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_loyalty_campaigns_merchant ON loyalty_campaigns(merchant_id);
CREATE INDEX idx_loyalty_campaigns_status ON loyalty_campaigns(status);
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_campaign ON transactions(campaign_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_loyalty_campaigns_type ON loyalty_campaigns(type);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_campaigns_updated_at
    BEFORE UPDATE ON loyalty_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables and important columns
COMMENT ON TABLE merchants IS 'Stores merchant information who run loyalty programs';
COMMENT ON TABLE loyalty_campaigns IS 'Stores loyalty campaign configurations and rules';
COMMENT ON TABLE customers IS 'Stores customer information participating in loyalty programs';
COMMENT ON TABLE transactions IS 'Stores all point transactions (earn, redeem, expire, adjust)';

COMMENT ON COLUMN loyalty_campaigns.campaign_config IS 'JSON configuration for campaign rules, rewards, and other settings';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction details in JSON format';
COMMENT ON COLUMN customers.total_points IS 'Current balance of loyalty points'; 