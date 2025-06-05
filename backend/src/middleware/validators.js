import { body, param, query, validationResult } from 'express-validator';

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be less than 255 characters')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ max: 255 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('points_ratio')
    .isFloat({ min: 0 })
    .withMessage('Points ratio must be a positive number'),
  body('campaign_config')
    .isObject()
    .withMessage('Campaign config must be a valid JSON object')
];

export const validateCustomer = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]{8,}$/)
    .withMessage('Please provide a valid phone number'),
  body(['first_name', 'last_name'])
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be a valid JSON object')
];

export const validateTransaction = [
  body('customer_id')
    .isUUID()
    .withMessage('Valid customer ID is required'),
  body('campaign_id')
    .isUUID()
    .withMessage('Valid campaign ID is required'),
  body('type')
    .isIn(['earn', 'redeem', 'expire', 'adjust'])
    .withMessage('Invalid transaction type'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be a valid JSON object')
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array()
    });
  }
  next();
}; 