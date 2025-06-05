import db from '../config/db.js';

const TABLE = 'merchants';

export const findByEmail = (email) => {
  return db(TABLE).where({ email }).first();
};

export const create = (merchant) => {
  return db(TABLE).insert(merchant).returning('*');
};

export const findById = (id) => {
  return db(TABLE).where({ id }).first();
};

export const update = (id, merchant) => {
  return db(TABLE).where({ id }).update(merchant).returning('*');
};

export const remove = (id) => {
  return db(TABLE).where({ id }).del();
}; 