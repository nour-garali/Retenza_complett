const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { globalSearch } = require('../controllers/searchController');

router.use(protect);
router.use(authorize('merchant'));

router.get('/', globalSearch);

module.exports = router;
