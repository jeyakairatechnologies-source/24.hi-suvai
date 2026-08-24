const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { protectAdmin } = require('../middleware/authMiddleware');

// @route   POST /api/orders
// @desc    Create a new customer order (Public checkout)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      customer,
      items,
      pricing,
      payment,
      notes
    } = req.body;

    const custName = (customer && customer.name && customer.name.trim()) ? customer.name.trim() : 'Customer';
    const custPhone = (customer && customer.phone && customer.phone.trim()) ? customer.phone.trim() : '9876543210';
    const custAddress = (customer && customer.address && customer.address.trim()) ? customer.address.trim() : 'Delivery Address';
    const custCity = (customer && customer.city && customer.city.trim()) ? customer.city.trim() : 'Tirunelveli';
    const custPin = (customer && customer.pincode && customer.pincode.trim()) ? customer.pincode.trim() : '627004';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one product item.'
      });
    }

    let generatedOrderId = orderId || ('HS-' + Math.floor(100000 + Math.random() * 900000));
    const existing = await Order.findOne({ orderId: generatedOrderId });
    if (existing) {
      generatedOrderId = 'HS-' + Math.floor(100000 + Math.random() * 900000);
    }

    const newOrder = new Order({
      orderId: generatedOrderId,
      customer: {
        name: custName,
        email: (customer?.email || '').trim(),
        phone: custPhone,
        address: custAddress,
        apartment: (customer?.apartment || '').trim(),
        city: custCity,
        state: customer?.state || 'Tamil Nadu',
        pincode: custPin
      },
      items: items.map(item => {
        const prodId = item.productId || item._id || item.product;
        const isMongoId = prodId && typeof prodId === 'string' && /^[0-9a-fA-F]{24}$/.test(prodId);
        return {
          product: isMongoId ? prodId : null,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity || 1),
          image: item.image || item.img || 'suvai1.png',
          unit: item.unit || '250g'
        };
      }),
      pricing: {
        subtotal: Number(pricing?.subtotal || 0),
        shipping: Number(pricing?.shipping || 0),
        discount: Number(pricing?.discount || 0),
        grandTotal: Number(pricing?.grandTotal || pricing?.total || 0)
      },
      payment: {
        method: payment?.method || 'upi',
        status: payment?.status || (payment?.method === 'cod' ? 'pending' : 'paid')
      },
      orderStatus: 'Pending',
      notes: notes || ''
    });

    const savedOrder = await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while placing order.'
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (Admin only with search, status filter, pagination)
// @access  Private (Admin)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderId: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
        { 'customer.city': searchRegex }
      ];
    }

    const pageSize = parseInt(limit, 10);
    const currentPage = parseInt(page, 10);
    const skip = (currentPage - 1) * pageSize;

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Summary counts for Admin KPI
    const totalCount = await Order.countDocuments();
    const pendingCount = await Order.countDocuments({ orderStatus: 'Pending' });
    const processingCount = await Order.countDocuments({ orderStatus: 'Processing' });
    const shippedCount = await Order.countDocuments({ orderStatus: 'Shipped' });
    const deliveredCount = await Order.countDocuments({ orderStatus: 'Delivered' });
    const totalRevenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    return res.status(200).json({
      success: true,
      totalOrders,
      currentPage,
      totalPages: Math.ceil(totalOrders / pageSize),
      orders,
      stats: {
        totalCount,
        pendingCount,
        processingCount,
        shippedCount,
        deliveredCount,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching orders.'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private (Admin)
router.get('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      order.orderStatus = status;
    }
    if (paymentStatus) {
      order.payment.status = paymentStatus;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Private (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await Order.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
