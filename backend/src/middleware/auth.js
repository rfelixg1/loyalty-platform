import jwt from 'jsonwebtoken';
import { findById } from '../models/merchant.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const merchant = await findById(decoded.merchant_id);
    if (!merchant) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyResource = (req, res, next) => {
  const merchantId = req.merchant.id;
  const resourceMerchantId = req.body.merchant_id || req.params.merchant_id;

  if (merchantId !== resourceMerchantId) {
    return res.status(403).json({ message: 'Unauthorized access to this resource' });
  }

  next();
}; 