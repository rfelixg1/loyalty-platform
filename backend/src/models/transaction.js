import db from '../config/db.js';

const TABLE = 'transactions';

export const create = (transaction) => {
  return db(TABLE).insert(transaction).returning('*');
};

export const findByMerchant = (merchant_id) => {
  return db(TABLE)
    .where({ merchant_id })
    .orderBy('created_at', 'desc');
};

export const findByCustomer = (customer_id, merchant_id) => {
  return db(TABLE)
    .where({ customer_id, merchant_id })
    .orderBy('created_at', 'desc');
};

export const findByCampaign = (campaign_id, merchant_id) => {
  return db(TABLE)
    .where({ campaign_id, merchant_id })
    .orderBy('created_at', 'desc');
}; 