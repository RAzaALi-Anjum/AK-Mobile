import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DashboardPage = () => {
    const { admin } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/sales/dashboard-stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    // Build monthly purchase chart data
    const monthlyPurchaseData = [];
    if (stats) {
        for (let d = 1; d <= stats.daysInMonth; d++) {
            const found = stats.monthlyPurchases.find((p) => p._id === d);
            monthlyPurchaseData.push({ day: d, amount: found ? found.total : 0 });
        }
    }

    // Build yearly purchase chart data
    const yearlyPurchaseData = MONTHS.map((m, i) => {
        const found = stats?.yearlyPurchases.find((p) => p._id === i + 1);
        return { month: m, amount: found ? found.total : 0 };
    });

    // Build monthly sales & profit chart data
    const monthlySalesData = [];
    if (stats) {
        for (let d = 1; d <= stats.daysInMonth; d++) {
            const found = stats.monthlySales.find((s) => s._id === d);
            monthlySalesData.push({
                day: d,
                sales: found ? found.totalSales : 0,
                profit: found ? found.totalProfit : 0,
            });
        }
    }

    // Build yearly sales & profit chart data
    const yearlySalesData = MONTHS.map((m, i) => {
        const found = stats?.yearlySales.find((s) => s._id === i + 1);
        return {
            month: m,
            sales: found ? found.totalSales : 0,
            profit: found ? found.totalProfit : 0,
        };
    });

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Welcome, {admin?.name || 'Admin'}</h1>
                <p className="page-subtitle">Here's your business overview</p>
            </div>

            <div className="charts-grid">
                {/* Monthly Purchases */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Monthly Purchases</h3>
                        <span className="chart-badge">{stats?.currentMonth} {stats?.currentYear}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={monthlyPurchaseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                            <Bar dataKey="amount" name="Purchase Amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Yearly Purchases */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Yearly Purchases</h3>
                        <span className="chart-badge">{stats?.currentYear}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={yearlyPurchaseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                            <Area type="monotone" dataKey="amount" name="Purchase Amount" stroke="#8b5cf6" fill="url(#purpleGrad)" />
                            <defs>
                                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Sales & Profit */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Monthly Sales & Profit</h3>
                        <span className="chart-badge">{stats?.currentMonth} {stats?.currentYear}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={monthlySalesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                            <Legend />
                            <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Yearly Sales & Profit */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Yearly Sales & Profit</h3>
                        <span className="chart-badge">{stats?.currentYear}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={yearlySalesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fill="url(#greenGrad)" />
                            <Area type="monotone" dataKey="profit" name="Profit" stroke="#f59e0b" fill="url(#yellowGrad)" />
                            <defs>
                                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
