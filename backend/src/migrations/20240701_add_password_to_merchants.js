/**
 * Migration: Add password column to merchants table
 * @param {object} knex - Knex instance
 * @returns {Promise}
 */
export const up = async function(knex) {
  return knex.schema.alterTable('merchants', function(table) {
    // Add password column as NOT NULL
    table.text('password').notNullable();
    
    // Ensure email has a unique constraint
    table.unique(['email'], 'merchants_email_unique');
    
    // Note: No need to update the updated_at trigger as it was created in schema.sql
    // and handles all column updates automatically
  });
};

/**
 * Rollback: Remove password column from merchants table
 * @param {object} knex - Knex instance
 * @returns {Promise}
 */
export const down = async function(knex) {
  return knex.schema.alterTable('merchants', function(table) {
    // Drop the password column
    table.dropColumn('password');
    
    // Note: We don't remove the email unique constraint as it should remain
  });
}; 