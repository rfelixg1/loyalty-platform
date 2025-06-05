import db from '../config/db.js';

const TABLE = 'customers';

export const findAll = (merchant_id) => {
  return db(TABLE).where({ merchant_id });
};

export const findById = (id, merchant_id) => {
  return db(TABLE).where({ id, merchant_id }).first();
};

export const create = (customer) => {
  return db(TABLE).insert(customer).returning('*');
};

export const update = (id, merchant_id, customer) => {
  return db(TABLE).where({ id, merchant_id }).update(customer).returning('*');
};

export const remove = (id, merchant_id) => {
  return db(TABLE).where({ id, merchant_id }).del();
};

export const updatePoints = (id, merchant_id, points) => {
  return db(TABLE)
    .where({ id, merchant_id })
    .increment('total_points', points)
    .returning('*');
}; 