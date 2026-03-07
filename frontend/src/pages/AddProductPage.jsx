import { useState, useRef } from 'react';
import api from '../services/api';
import { MdCheckCircle, MdCloudUpload, MdInsertDriveFile, MdClose, MdDownload } from 'react-icons/md';

const AddProductPage = () => {
    const [form, setForm] = useState({
        productName: '',
        productType: '',
        quantity: '',
        purchaseAmount: '',
        purchaseDate: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Bulk upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [bulkProductType, setBulkProductType] = useState('');
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await api.post('/products', {
                ...form,
                quantity: Number(form.quantity),
                purchaseAmount: Number(form.purchaseAmount),
            });
            setSuccess('Product added successfully!');
            setForm({
                productName: '',
                productType: '',
                quantity: '',
                purchaseAmount: '',
                purchaseDate: new Date().toISOString().split('T')[0],
            });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    // --- Bulk Upload Functions ---

    const handleDownloadSample = () => {
        // Create a hierarchical sample matching the expected format
        const headers = ['Sr No', 'Month and Product', 'Quantity', 'Amount (PKR)'];
        const sampleRows = [
            ['1', 'Feb 2026', '70', '281450'],
            ['', '1 TB HARD', '3', '26000'],
            ['', '2amp adaptor', '2', '750'],
            ['', '2mp Hybrid', '2', '10000'],
            ['', 'Dell Latitude E7470', '5', '225000'],
            ['2', 'Mar 2026', '20', '150000'],
            ['', 'HP EliteBook 840', '10', '100000'],
            ['', 'Canon EOS 200D', '10', '50000'],
        ];

        // Build CSV and trigger download  
        let csv = headers.join(',') + '\n';
        sampleRows.forEach((row) => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_products.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            setUploadResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setUploadFile(file);
            setUploadResult(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleRemoveFile = () => {
        setUploadFile(null);
        setUploadResult(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleBulkUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            if (bulkProductType) {
                formData.append('productType', bulkProductType);
            }

            const { data } = await api.post('/products/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                },
            });

            setUploadResult({ type: 'success', ...data });
            setUploadFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setUploadResult({
                type: 'error',
                message: err.response?.data?.message || 'Upload failed',
                errors: err.response?.data?.errors,
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Add Product</h1>
                <p className="page-subtitle">Add a new product to your inventory</p>
            </div>

            <div className="form-card">
                {success && (
                    <div className="alert alert-success">
                        <MdCheckCircle /> {success}
                    </div>
                )}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="productType">Product Type</label>
                            <select
                                id="productType"
                                name="productType"
                                value={form.productType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Camera">Camera</option>
                                <option value="Accessories">Accessories</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="productName">Product Name</label>
                            <input
                                id="productName"
                                name="productName"
                                type="text"
                                value={form.productName}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">Quantity</label>
                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={handleChange}
                                placeholder="Enter quantity"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="purchaseAmount">Purchase Amount (PKR)</label>
                            <input
                                id="purchaseAmount"
                                name="purchaseAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.purchaseAmount}
                                onChange={handleChange}
                                placeholder="Enter purchase amount"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="purchaseDate">Purchase Date</label>
                            <input
                                id="purchaseDate"
                                name="purchaseDate"
                                type="date"
                                value={form.purchaseDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner-sm" /> : 'Add Product'}
                    </button>
                </form>
            </div>

            {/* Bulk Upload Section */}
            <div className="section-divider">
                <span>Or Bulk Upload</span>
            </div>

            <div className="bulk-upload-card">
                <div className="bulk-upload-header">
                    <h3>📁 Upload Products via Excel</h3>
                    <button className="btn btn-outline btn-sm" onClick={handleDownloadSample}>
                        <MdDownload /> Download Sample
                    </button>
                </div>

                {/* Product Type Dropdown */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="bulkProductType" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                        Product Type <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.8rem' }}>(applied to all products if not in Excel)</span>
                    </label>
                    <select
                        id="bulkProductType"
                        value={bulkProductType}
                        onChange={(e) => setBulkProductType(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    >
                        <option value="">Select Type</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Camera">Camera</option>
                        <option value="Accessories">Accessories</option>
                    </select>
                </div>

                {/* Upload Zone */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {!uploadFile ? (
                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="upload-zone-icon"><MdCloudUpload /></div>
                        <div className="upload-zone-text">Click or drag & drop your Excel file here</div>
                        <div className="upload-zone-hint">Supports .xlsx, .xls, .csv — Max 5MB</div>
                    </div>
                ) : (
                    <>
                        {/* File Preview */}
                        <div className="file-preview">
                            <div className="file-preview-icon"><MdInsertDriveFile /></div>
                            <div className="file-preview-info">
                                <div className="file-preview-name">{uploadFile.name}</div>
                                <div className="file-preview-size">{formatFileSize(uploadFile.size)}</div>
                            </div>
                            <button className="file-preview-remove" onClick={handleRemoveFile}>
                                <MdClose />
                            </button>
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="upload-progress">
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        <div className="upload-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleBulkUpload}
                                disabled={uploading}
                            >
                                {uploading ? <><span className="spinner-sm" /> Uploading...</> : <><MdCloudUpload /> Upload Products</>}
                            </button>
                        </div>
                    </>
                )}

                {/* Upload Result */}
                {uploadResult && (
                    <div className={`upload-result ${uploadResult.type}`}>
                        {uploadResult.type === 'success' ? (
                            <>
                                <MdCheckCircle /> {uploadResult.message}
                                {uploadResult.insertedCount > 0 && ` — ${uploadResult.insertedCount} product(s) inserted.`}
                                {uploadResult.errorCount > 0 && ` (${uploadResult.errorCount} row(s) skipped)`}
                            </>
                        ) : (
                            <>❌ {uploadResult.message}</>
                        )}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <ul className="upload-errors">
                                {uploadResult.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddProductPage;
