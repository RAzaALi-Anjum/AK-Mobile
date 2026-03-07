const express = require('express');
const router = express.Router();
const {
    checkout,
    getSales,
    getIncome,
    getDashboardStats,
} = require('../controllers/saleController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/dashboard-stats', getDashboardStats);
router.get('/income', getIncome);
router.post('/checkout', checkout);
router.get('/', getSales);

module.exports = router;
