/**
 * Add campaign type enum and column to loyalty_campaigns table
 */
export const up = async function(knex) {
  // Create the enum type first
  await knex.raw(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
        CREATE TYPE campaign_type AS ENUM ('stamp', 'points', 'cashback');
      END IF;
    END $$;
  `);

  // Add the type column with a default value
  return knex.schema.alterTable('loyalty_campaigns', function(table) {
    // Add type column using raw SQL since Knex doesn't support ENUM directly
    knex.raw(`
      ALTER TABLE loyalty_campaigns 
      ADD COLUMN type campaign_type NOT NULL DEFAULT 'stamp'
    `);

    // Create an index on type for better query performance
    table.index(['type'], 'idx_loyalty_campaigns_type');
  });
};

/**
 * Remove campaign type column and enum
 */
export const down = async function(knex) {
  await knex.schema.alterTable('loyalty_campaigns', function(table) {
    // Drop the index first
    table.dropIndex([], 'idx_loyalty_campaigns_type');
    
    // Drop the column
    knex.raw('ALTER TABLE loyalty_campaigns DROP COLUMN type');
  });

  // Drop the enum type
  return knex.raw(`
    DROP TYPE IF EXISTS campaign_type;
  `);
}; 