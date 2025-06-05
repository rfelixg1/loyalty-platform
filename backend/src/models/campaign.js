import db from '../config/db.js';

const TABLE = 'loyalty_campaigns';

export const findAll = (merchant_id) => {
  return db(TABLE).where({ merchant_id });
};

export const findById = (id, merchant_id) => {
  return db(TABLE).where({ id, merchant_id }).first();
};

export const create = (campaign) => {
  return db(TABLE).insert(campaign).returning('*');
};

export const update = (id, merchant_id, campaign) => {
  return db(TABLE).where({ id, merchant_id }).update(campaign).returning('*');
};

export const remove = (id, merchant_id) => {
  return db(TABLE).where({ id, merchant_id }).del();
}; 