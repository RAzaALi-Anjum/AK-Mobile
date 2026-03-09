import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CATEGORIES = ['All', 'Laptop', 'Camera'];

const IncomePage = () => {
    const [income, setIncome] = useState({ sales: [], dailyTotals: [], summary: { totalSales: 0, totalPurchaseCost: 0, totalProfit: 0, totalLoss: 0 } });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchIncome = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCategory !== 'All') params.append('type', activeCategory);
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            const query = params.toString() ? `?${params.toString()}` : '';
            const { data } = await api.get(`/sales/income${query}`);
            setIncome(data);
        } catch (err) {
            console.error('Failed to fetch income:', err);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, fromDate, toDate]);

    useEffect(() => {
        fetchIncome();
    }, [fetchIncome]);

    const filteredSales = income.sales.filter(sale =>
        sale.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Income Report</h1>
                <p className="page-subtitle">Track your sales, profit, and loss</p>
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

            {/* Date Filters */}
            <div className="filter-row">
                <div className="filter-group">
                    <label>From Date</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>To Date</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                {(fromDate || toDate) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>
                        Clear Dates
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-bar-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Search sale by product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-input"
                    style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Summary Dashboard */}
                    <div className="income-summary-grid">
                        <div className="summary-stat-card sales">
                            <div className="summary-stat-label">Total Sales</div>
                            <div className="summary-stat-value text-primary-accent">
                                PKR {income.summary?.totalSales?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card purchases">
                            <div className="summary-stat-label">Total Purchases</div>
                            <div className="summary-stat-value text-warning">
                                PKR {income.summary?.totalPurchaseCost?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card profit">
                            <div className="summary-stat-label">Total Profit</div>
                            <div className="summary-stat-value text-success">
                                PKR {income.summary?.totalProfit?.toLocaleString() || '0'}
                            </div>
                        </div>
                        <div className="summary-stat-card loss">
                            <div className="summary-stat-label">Total Loss</div>
                            <div className="summary-stat-value text-danger">
                                PKR {income.summary?.totalLoss?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>

                    {/* Sales Table */}
                    {filteredSales.length === 0 ? (
                        <div className="empty-state">
                            <p>No sales recorded{activeCategory !== 'All' ? ` for ${activeCategory}` : ''}{fromDate || toDate ? ' in selected date range' : ''}.</p>
                        </div>
                    ) : (
                        <>
                            <div className="cart-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Type</th>
                                            <th>Qty Sold</th>
                                            <th>Purchase Cost</th>
                                            <th>Sale Amount</th>
                                            <th>Profit / Loss</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map((sale) => (
                                            <tr key={sale._id}>
                                                <td className="fw-600">{sale.productName}</td>
                                                <td><span className="table-badge">{sale.productType}</span></td>
                                                <td>{sale.quantitySold}</td>
                                                <td>PKR {sale.totalPurchaseCost.toLocaleString()}</td>
                                                <td>PKR {sale.totalSale.toLocaleString()}</td>
                                                <td className={sale.profit >= 0 ? 'text-success' : 'text-danger'}>
                                                    PKR {sale.profit.toLocaleString()}
                                                </td>
                                                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Daily Report */}
                            <div className="income-daily-section">
                                <h2>Daily Income Report</h2>
                                <div className="cart-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Total Sales</th>
                                                <th>Total Purchase Cost</th>
                                                <th>Profit</th>
                                                <th>Loss</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {income.dailyTotals.map((day) => (
                                                <tr key={day.date}>
                                                    <td className="fw-600">
                                                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td>PKR {day.totalSales.toLocaleString()}</td>
                                                    <td>PKR {day.totalPurchaseCost.toLocaleString()}</td>
                                                    <td className="text-success">PKR {day.totalProfit.toLocaleString()}</td>
                                                    <td className="text-danger">PKR {day.totalLoss.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default IncomePage;
