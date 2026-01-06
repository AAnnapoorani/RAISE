const express = require('express');
const router = express.Router();
const HardwareRequest = require('../models/HardwareRequest');
const Hardware = require('../models/Hardware');
const { getNextSequence } = require('../utils/counters');

// Get all requests for logged-in employee
router.get('/', async (req, res) => {
  try {
    const emp_id = req.query.emp_id;
    
    if (!emp_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const requests = await HardwareRequest.find({ emp_id }).sort({ createdAt: -1 });
    
    if (!requests || requests.length === 0) {
      return res.status(200).json({ 
        message: 'No requests found',
        data: [] 
      });
    }

    res.status(200).json({ 
      message: 'Requests retrieved successfully',
      data: requests 
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Get single request details
router.get('/:request_id', async (req, res) => {
  try {
    const { request_id } = req.params;
    const emp_id = req.query.emp_id;

    if (!emp_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const request = await HardwareRequest.findOne({ request_id, emp_id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ 
      message: 'Request retrieved successfully',
      data: request 
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Error fetching request', error: error.message });
  }
});

// Create new hardware request
router.post('/create', async (req, res) => {
  try {
    const { emp_id, asset_id, quantity, description } = req.body;

    // Validation
    if (!emp_id || !asset_id || !quantity) {
      return res.status(400).json({ message: 'Employee ID, Asset ID, and Quantity are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if hardware exists
    const hardware = await Hardware.findOne({ asset_id });
    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    // Check stock availability
    if (hardware.quantity < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: hardware.quantity,
        requested: quantity
      });
    }

    // Generate request ID using atomic counter to avoid races
    const request_id = await getNextSequence('request_id', { prefix: 'REQ-', pad: 6 });

    // Create new request
    const newRequest = new HardwareRequest({
      request_id,
      emp_id,
      asset_id,
      asset_name: hardware.name,
      quantity,
      description: description || '',
      status: 'Pending',
      allocated: false,
      createdAt: new Date()
    });

    await newRequest.save();

    res.status(201).json({ 
      message: 'Request created successfully',
      data: newRequest 
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
});

// Update request (only if Pending)
router.put('/:request_id/update', async (req, res) => {
  try {
    const { request_id } = req.params;
    const { emp_id, quantity, description } = req.body;

    if (!emp_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const request = await HardwareRequest.findOne({ request_id, emp_id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only allow update if status is Pending
    if (request.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot update request with status: ${request.status}` 
      });
    }

    // Update fields
    if (quantity) {
      if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      request.quantity = quantity;
    }

    if (description !== undefined) {
      request.description = description;
    }

    request.updatedAt = new Date();
    await request.save();

    res.status(200).json({ 
      message: 'Request updated successfully',
      data: request 
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
});

// Cancel request (only if Pending)
router.delete('/:request_id/cancel', async (req, res) => {
  try {
    const { request_id } = req.params;
    const { emp_id } = req.query;

    if (!emp_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const request = await HardwareRequest.findOne({ request_id, emp_id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only allow cancellation if status is Pending
    if (request.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot cancel request with status: ${request.status}` 
      });
    }

    await HardwareRequest.deleteOne({ request_id, emp_id });

    res.status(200).json({ 
      message: 'Request cancelled successfully',
      data: { request_id }
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ message: 'Error cancelling request', error: error.message });
  }
});

// Get request status
router.get('/:request_id/status', async (req, res) => {
  try {
    const { request_id } = req.params;
    const { emp_id } = req.query;

    if (!emp_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const request = await HardwareRequest.findOne({ request_id, emp_id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ 
      message: 'Status retrieved successfully',
      data: {
        request_id: request.request_id,
        status: request.status,
        allocated: request.allocated,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ message: 'Error fetching status', error: error.message });
  }
});

module.exports = router;