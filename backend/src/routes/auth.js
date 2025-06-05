import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as merchantModel from '../models/merchant.js';
import { validateRegister, validateLogin } from '../middleware/validators.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Rate limiter for registration - 5 attempts per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many registration attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for login - 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to specific routes
router.post('/register', registerLimiter, validateRegister, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email, password, name } = req.body;

  // Check if merchant already exists
  const existingMerchant = await merchantModel.findByEmail(email);
  if (existingMerchant) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create merchant
  const [merchant] = await merchantModel.create({
    email,
    password: hashedPassword,
    name
  });

  // Generate token
  const token = jwt.sign(
    { merchant_id: merchant.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    data: {
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name
      }
    }
  });
}));

router.post('/login', loginLimiter, validateLogin, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  // Check if merchant exists
  const merchant = await merchantModel.findByEmail(email);
  if (!merchant) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, merchant.password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = jwt.sign(
    { merchant_id: merchant.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name
      }
    }
  });
}));

export default router; 