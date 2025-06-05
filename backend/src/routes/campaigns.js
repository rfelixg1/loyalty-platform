import express from 'express';
import { validationResult } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import * as campaignModel from '../models/campaign.js';
import { validateCampaign } from '../middleware/validators.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all campaigns for merchant
router.get('/', asyncHandler(async (req, res) => {
  const campaigns = await campaignModel.findAll(req.merchant.id);
  res.json({
    success: true,
    data: campaigns
  });
}));

// Get single campaign
router.get('/:id', asyncHandler(async (req, res) => {
  const campaign = await campaignModel.findById(req.params.id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check ownership
  if (campaign.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Campaign belongs to another merchant'
    });
  }

  res.json({
    success: true,
    data: campaign
  });
}));

// Create campaign
router.post('/', validateCampaign, asyncHandler(async (req, res) => {
  const campaignData = {
    ...req.body,
    merchant_id: req.merchant.id
  };

  const [campaign] = await campaignModel.create(campaignData);
  res.status(201).json({
    success: true,
    data: campaign
  });
}));

// Update campaign
router.put('/:id', validateCampaign, asyncHandler(async (req, res) => {
  // First check ownership
  const existingCampaign = await campaignModel.findById(req.params.id);
  
  if (!existingCampaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (existingCampaign.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Campaign belongs to another merchant'
    });
  }

  // Proceed with update
  const [campaign] = await campaignModel.update(
    req.params.id,
    req.merchant.id,
    req.body
  );

  res.json({
    success: true,
    data: campaign
  });
}));

// Delete campaign
router.delete('/:id', asyncHandler(async (req, res) => {
  // First check ownership
  const existingCampaign = await campaignModel.findById(req.params.id);
  
  if (!existingCampaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (existingCampaign.merchant_id !== req.merchant.id) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Campaign belongs to another merchant'
    });
  }

  // Proceed with deletion
  await campaignModel.remove(req.params.id, req.merchant.id);
  res.status(204).send();
}));

export default router; 