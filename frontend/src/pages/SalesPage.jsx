import { useState, useEffect } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { MdAddShoppingCart } from 'react-icons/md';

const CATEGORIES = ['All', 'Laptop', 'Camera'];

const SalesPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToCart } = useCart();

    const fetchProducts = async (category) => {
        setLoading(true);
        try {
            const params = category && category !== 'All' ? `?type=${category}` : '';
            const { data } = await api.get(`/products${params}`);
            setProducts(data.filter((p) => p.quantity > 0));
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(activeCategory);
    }, [activeCategory]);

    const handleQuantityChange = (id, val) => {
        setQuantities({ ...quantities, [id]: Math.max(1, Number(val)) });
    };

    const handleAddToCart = (product) => {
        const qty = quantities[product._id] || 1;
        if (qty > product.quantity) {
            alert(`Only ${product.quantity} available in stock`);
            return;
        }
        addToCart(product, qty);
        alert(`${product.productName} (x${qty}) added to cart!`);
    };

    const filteredProducts = products.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Sales</h1>
                <p className="page-subtitle">Select products to sell</p>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
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
                    <p>No products available for sale{activeCategory !== 'All' ? ` in ${activeCategory} category` : ''}.</p>
                </div>
            ) : (
                <div className="product-cards-grid">
                    {filteredProducts.map((product) => (
                        <div key={product._id} className="product-card sale-card">
                            <div className="product-card-badge">{product.productType}</div>
                            <h3 className="product-card-title">{product.productName}</h3>
                            <div className="product-card-details">
                                <div className="detail-row">
                                    <span>Available</span>
                                    <span className="detail-value stock-badge">{product.quantity}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Purchase Price</span>
                                    <span className="detail-value">PKR {product.purchaseAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="sale-card-actions">
                                <div className="quantity-input-group">
                                    <label>Qty:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={product.quantity}
                                        value={quantities[product._id] || 1}
                                        onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                                    />
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(product)}>
                                    <MdAddShoppingCart /> Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SalesPage;
