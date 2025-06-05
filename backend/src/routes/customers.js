import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as customerModel from '../models/customer.js';
import { validateCustomer } from '../middleware/validators.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all customers for merchant
router.get('/', asyncHandler(async (req, res) => {
  const customers = await customerModel.findAll(req.merchant.id);
  res.json({
    success: true,
    data: customers
  });
}));

// Get single customer
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await customerModel.findById(req.params.id);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Check ownership
  if (customer.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Customer belongs to another merchant'
    });
  }

  res.json({
    success: true,
    data: customer
  });
}));

// Create customer
router.post('/', validateCustomer, asyncHandler(async (req, res) => {
  const customerData = {
    ...req.body,
    merchant_id: req.merchant.id
  };
  
  // Check for existing customer with same email or phone
  if (customerData.email) {
    const existingWithEmail = await customerModel.findByEmail(customerData.email);
    if (existingWithEmail && existingWithEmail.merchant_id === req.merchant.id) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }
  }
  
  if (customerData.phone) {
    const existingWithPhone = await customerModel.findByPhone(customerData.phone);
    if (existingWithPhone && existingWithPhone.merchant_id === req.merchant.id) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }
  }

  const [customer] = await customerModel.create(customerData);
  res.status(201).json({
    success: true,
    data: customer
  });
}));

// Update customer
router.put('/:id', validateCustomer, asyncHandler(async (req, res) => {
  // First check ownership
  const existingCustomer = await customerModel.findById(req.params.id);
  
  if (!existingCustomer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (existingCustomer.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Customer belongs to another merchant'
    });
  }

  // Check for duplicate email/phone
  if (req.body.email && req.body.email !== existingCustomer.email) {
    const existingWithEmail = await customerModel.findByEmail(req.body.email);
    if (existingWithEmail && existingWithEmail.id !== req.params.id) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }
  }
  
  if (req.body.phone && req.body.phone !== existingCustomer.phone) {
    const existingWithPhone = await customerModel.findByPhone(req.body.phone);
    if (existingWithPhone && existingWithPhone.id !== req.params.id) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }
  }

  // Proceed with update
  const [customer] = await customerModel.update(
    req.params.id,
    req.merchant.id,
    req.body
  );

  res.json({
    success: true,
    data: customer
  });
}));

// Delete customer
router.delete('/:id', asyncHandler(async (req, res) => {
  // First check ownership
  const existingCustomer = await customerModel.findById(req.params.id);
  
  if (!existingCustomer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (existingCustomer.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Customer belongs to another merchant'
    });
  }

  // Proceed with deletion
  await customerModel.remove(req.params.id, req.merchant.id);
  res.status(204).send();
}));

export default router; 