/**
 * Migration to add constraints and indexes to the loyalty platform database
 */
export const up = async function(knex) {
  return knex.schema
    // Add CHECK constraint for non-negative points
    .raw(`
      ALTER TABLE customers 
      ADD CONSTRAINT chk_customers_points_non_negative 
      CHECK (total_points >= 0)
    `)
    // Add CHECK constraint for campaign dates
    .raw(`
      ALTER TABLE loyalty_campaigns 
      ADD CONSTRAINT chk_campaign_dates_valid 
      CHECK (end_date IS NULL OR end_date > start_date)
    `)
    // Add partial index for active customers' email
    .raw(`
      CREATE INDEX idx_customers_email_active 
      ON customers(email) 
      WHERE status = 'active'
    `)
    // Add partial index for active customers' phone
    .raw(`
      CREATE INDEX idx_customers_phone_active 
      ON customers(phone) 
      WHERE status = 'active'
    `)
    // Add composite index for transactions
    .raw(`
      CREATE INDEX idx_transactions_merchant_date 
      ON transactions(merchant_id, created_at)
    `);
};

export const down = async function(knex) {
  return knex.schema
    // Remove indexes first
    .raw('DROP INDEX IF EXISTS idx_transactions_merchant_date')
    .raw('DROP INDEX IF EXISTS idx_customers_phone_active')
    .raw('DROP INDEX IF EXISTS idx_customers_email_active')
    // Then remove constraints
    .raw(`
      ALTER TABLE loyalty_campaigns 
      DROP CONSTRAINT IF EXISTS chk_campaign_dates_valid
    `)
    .raw(`
      ALTER TABLE customers 
      DROP CONSTRAINT IF EXISTS chk_customers_points_non_negative
    `);
}; 