import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';
import knexInstance from '../db/knex.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET /merchants/me - Get current merchant profile
router.get('/me', asyncHandler(async (req, res) => {
  const merchant = await knexInstance('merchants')
    .select('id', 'name', 'email', 'created_at', 'updated_at')
    .where({ id: req.merchant.id })
    .first();

  if (!merchant) {
    return res.status(404).json({
      message: 'Merchant not found'
    });
  }

  res.json(merchant);
}));

// PUT /merchants/me - Update merchant profile
router.put('/me', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required')
], asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email } = req.body;

  try {
    // Check if email is already used by another merchant
    const existingMerchant = await knexInstance('merchants')
      .where('email', email)
      .whereNot('id', req.merchant.id)
      .first();

    if (existingMerchant) {
      return res.status(409).json({
        message: 'Email is already in use'
      });
    }

    // Update merchant
    const [updatedMerchant] = await knexInstance('merchants')
      .where({ id: req.merchant.id })
      .update({
        name,
        email,
        updated_at: new Date()
      })
      .returning(['id', 'name', 'email', 'created_at', 'updated_at']);

    if (!updatedMerchant) {
      return res.status(404).json({
        message: 'Merchant not found'
      });
    }

    res.json(updatedMerchant);

  } catch (error) {
    // Handle potential database constraint errors
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({
        message: 'Email is already in use'
      });
    }
    throw error;
  }
}));

// POST /merchants/me/password - Update merchant password
router.post('/me/password', [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/\d/).withMessage('New password must contain at least one number')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
], asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { oldPassword, newPassword } = req.body;

  // Get current merchant with password
  const merchant = await knexInstance('merchants')
    .select('password')
    .where({ id: req.merchant.id })
    .first();

  if (!merchant) {
    return res.status(404).json({
      message: 'Merchant not found'
    });
  }

  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, merchant.password);
  if (!isValidPassword) {
    return res.status(400).json({
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await knexInstance('merchants')
    .where({ id: req.merchant.id })
    .update({
      password: hashedPassword,
      updated_at: new Date()
    });

  res.json({
    message: 'Password updated successfully'
  });
}));

export default router; 