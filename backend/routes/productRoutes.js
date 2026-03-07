const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpload,
} = require('../controllers/productController');
const protect = require('../middleware/auth');

// Configure multer for memory storage (Excel files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    },
});

router.use(protect);

router.route('/').get(getProducts).post(createProduct);
router.post('/bulk-upload', upload.single('file'), bulkUpload);
router.route('/:id').put(updateProduct).delete(deleteProduct);

module.exports = router;
