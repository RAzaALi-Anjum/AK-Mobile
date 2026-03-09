import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdEdit, MdDelete, MdClose, MdSave } from 'react-icons/md';

const CATEGORIES = ['All', 'Laptop', 'Camera'];

const ViewProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editProduct, setEditProduct] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProducts = async (category) => {
        setLoading(true);
        try {
            const params = category && category !== 'All' ? `?type=${category}` : '';
            const { data } = await api.get(`/products${params}`);
            setProducts(data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(activeCategory);
    }, [activeCategory]);

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setEditProduct(null);
    };

    const handleEdit = (product) => {
        setEditProduct(product._id);
        setEditForm({
            productName: product.productName,
            productType: product.productType,
            quantity: product.quantity,
            purchaseAmount: product.purchaseAmount,
            purchaseDate: new Date(product.purchaseDate).toISOString().split('T')[0],
        });
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await api.put(`/products/${editProduct}`, {
                ...editForm,
                quantity: Number(editForm.quantity),
                purchaseAmount: Number(editForm.purchaseAmount),
            });
            setEditProduct(null);
            fetchProducts(activeCategory);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter((p) => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const filteredProducts = products.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>View Products</h1>
                <p className="page-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} in inventory</p>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(cat)}
                    >
                        {cat === 'All' ? '📦 All' : cat === 'Laptop' ? '💻 Laptop' : '📷 Camera'}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="search-bar-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Search product by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-input"
                    style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" /></div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <p>No products found{activeCategory !== 'All' ? ` in ${activeCategory} category` : ''}.</p>
                </div>
            ) : (
                <div className="product-cards-grid">
                    {filteredProducts.map((product) => (
                        <div key={product._id} className="product-card">
                            {editProduct === product._id ? (
                                <div className="product-edit-form">
                                    <input
                                        value={editForm.productName}
                                        onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                                        placeholder="Product Name"
                                    />
                                    <select
                                        value={editForm.productType}
                                        onChange={(e) => setEditForm({ ...editForm, productType: e.target.value })}
                                    >
                                        <option value="Laptop">Laptop</option>
                                        <option value="Camera">Camera</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                        placeholder="Quantity"
                                    />
                                    <input
                                        type="number"
                                        value={editForm.purchaseAmount}
                                        onChange={(e) => setEditForm({ ...editForm, purchaseAmount: e.target.value })}
                                        placeholder="Purchase Amount"
                                    />
                                    <input
                                        type="date"
                                        value={editForm.purchaseDate}
                                        onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                                    />
                                    <div className="product-card-actions">
                                        <button className="btn btn-success btn-sm" onClick={handleUpdate} disabled={saving}>
                                            <MdSave /> {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditProduct(null)}>
                                            <MdClose /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="product-card-badge">{product.productType}</div>
                                    <h3 className="product-card-title">{product.productName}</h3>
                                    <div className="product-card-details">
                                        <div className="detail-row">
                                            <span>Quantity</span>
                                            <span className="detail-value">{product.quantity}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Purchase Amount</span>
                                            <span className="detail-value">PKR {product.purchaseAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Purchase Date</span>
                                            <span className="detail-value">{new Date(product.purchaseDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="product-card-actions">
                                        <button className="btn btn-warning btn-sm" onClick={() => handleEdit(product)}>
                                            <MdEdit /> Update
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id, product.productName)}>
                                            <MdDelete /> Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewProductsPage;
