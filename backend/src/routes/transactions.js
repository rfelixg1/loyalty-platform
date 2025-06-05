import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import * as transactionModel from '../models/transaction.js';
import * as customerModel from '../models/customer.js';
import * as campaignModel from '../models/campaign.js';
import { validateTransaction } from '../middleware/validators.js';
import asyncHandler from '../middleware/asyncHandler.js';
import knexInstance from '../db/knex.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all transactions for merchant
router.get('/', asyncHandler(async (req, res) => {
  const transactions = await transactionModel.findAll(req.merchant.id);
  res.json({
    success: true,
    data: transactions
  });
}));

// Get single transaction
router.get('/:id', asyncHandler(async (req, res) => {
  const transaction = await transactionModel.findById(req.params.id);
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Check ownership
  if (transaction.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Transaction belongs to another merchant'
    });
  }

  res.json({
    success: true,
    data: transaction
  });
}));

// Validation rules for transactions
const transactionValidation = [
  body('customer_id').isInt().withMessage('Customer ID must be an integer'),
  body('type').isIn(['points_added', 'stamp_added', 'cashback_redeemed', 'points_redeemed'])
    .withMessage('Invalid transaction type'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().trim().isLength({ min: 1 })
    .withMessage('Description cannot be empty if provided')
];

// Create transaction route with points balance check
router.post('/', 
  transactionValidation,
  asyncHandler(async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, type, amount, description = '' } = req.body;
    const merchant_id = req.merchant.id;

    try {
      // Start database transaction
      const result = await knexInstance.transaction(async (trx) => {
        // Check merchant ownership of customer
        const customer = await trx('customers')
          .where({ 
            id: customer_id,
            merchant_id: merchant_id
          })
          .first();

        if (!customer) {
          throw new Error('Customer not found or does not belong to merchant');
        }

        const oldBalance = customer.total_points;
        let newBalance;

        // Check transaction type and handle points balance
        if (type === 'points_added' || type === 'stamp_added') {
          newBalance = oldBalance + amount;
        } else if (type === 'cashback_redeemed' || type === 'points_redeemed') {
          if (oldBalance < amount) {
            throw new Error('Insufficient points');
          }
          newBalance = oldBalance - amount;
        }

        // Insert transaction
        const [transaction] = await trx('transactions')
          .insert({
            customer_id,
            merchant_id,
            type,
            amount,
            description,
            created_at: new Date()
          })
          .returning('*');

        // Update customer points
        const [updatedCustomer] = await trx('customers')
          .where({ id: customer_id })
          .update({ 
            total_points: newBalance,
            updated_at: new Date()
          })
          .returning('*');

        return {
          transaction,
          customer: updatedCustomer
        };
      });

      res.status(201).json(result);

    } catch (error) {
      if (error.message === 'Insufficient points') {
        return res.status(400).json({ message: 'Insufficient points' });
      }
      if (error.message === 'Customer not found or does not belong to merchant') {
        return res.status(404).json({ message: error.message });
      }
      throw error; // Let asyncHandler catch other errors
    }
  })
);

// Get customer transactions
router.get('/customer/:customerId', asyncHandler(async (req, res) => {
  // First verify customer belongs to merchant
  const customer = await customerModel.findById(req.params.customerId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }
  if (customer.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Customer belongs to another merchant'
    });
  }

  const transactions = await transactionModel.findByCustomer(req.params.customerId, req.merchant.id);
  res.json({
    success: true,
    data: transactions
  });
}));

// Get campaign transactions
router.get('/campaign/:campaignId', asyncHandler(async (req, res) => {
  // First verify campaign belongs to merchant
  const campaign = await campaignModel.findById(req.params.campaignId);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }
  if (campaign.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Campaign belongs to another merchant'
    });
  }

  const transactions = await transactionModel.findByCampaign(req.params.campaignId, req.merchant.id);
  res.json({
    success: true,
    data: transactions
  });
}));

export default router; 