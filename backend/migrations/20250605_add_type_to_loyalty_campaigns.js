/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create campaign_type enum if it doesn't exist
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
        CREATE TYPE campaign_type AS ENUM ('stamp', 'points', 'cashback');
      END IF;
    END $$;
  `);

  // Add type column to loyalty_campaigns table
  await knex.schema.alterTable('loyalty_campaigns', table => {
    table.specificType('type', 'campaign_type').notNullable().defaultTo('stamp');
  });

  // Create index on type column
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_loyalty_campaigns_type ON loyalty_campaigns(type);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop index
  await knex.raw(`DROP INDEX IF EXISTS idx_loyalty_campaigns_type;`);

  // Drop type column
  await knex.schema.alterTable('loyalty_campaigns', table => {
    table.dropColumn('type');
  });

  // Drop enum type if it exists
  await knex.raw(`
    DROP TYPE IF EXISTS campaign_type;
  `);
}; 