import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
    MdDashboard,
    MdInventory,
    MdAddBox,
    MdVisibility,
    MdPointOfSale,
    MdShoppingCart,
    MdAttachMoney,
    MdLogout,
    MdExpandMore,
    MdExpandLess,
    MdMenu,
    MdClose,
} from 'react-icons/md';

const Sidebar = () => {
    const { logout } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [productsOpen, setProductsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && <h2 className="sidebar-brand">AK Mobile</h2>}
                <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <MdMenu /> : <MdClose />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar-label">{item.label}</span>}
                    </NavLink>
                ))}

                {/* Products Dropdown */}
                <div className="sidebar-dropdown">
                    <button
                        className="sidebar-link sidebar-dropdown-toggle"
                        onClick={() => setProductsOpen(!productsOpen)}
                    >
                        <span className="sidebar-icon"><MdInventory /></span>
                        {!collapsed && (
                            <>
                                <span className="sidebar-label">Products</span>
                                <span className="sidebar-arrow">
                                    {productsOpen ? <MdExpandLess /> : <MdExpandMore />}
                                </span>
                            </>
                        )}
                    </button>
                    {productsOpen && !collapsed && (
                        <div className="sidebar-submenu">
                            <NavLink to="/products/add" className={({ isActive }) => `sidebar-link sub ${isActive ? 'active' : ''}`}>
                                <span className="sidebar-icon"><MdAddBox /></span>
                                <span className="sidebar-label">Add Product</span>
                            </NavLink>
                            <NavLink to="/products/view" className={({ isActive }) => `sidebar-link sub ${isActive ? 'active' : ''}`}>
                                <span className="sidebar-icon"><MdVisibility /></span>
                                <span className="sidebar-label">View Products</span>
                            </NavLink>
                        </div>
                    )}
                </div>

                <NavLink to="/sales" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-icon"><MdPointOfSale /></span>
                    {!collapsed && <span className="sidebar-label">Sales</span>}
                </NavLink>

                <NavLink to="/cart" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-icon"><MdShoppingCart /></span>
                    {!collapsed && <span className="sidebar-label">Cart</span>}
                    {cartItems.length > 0 && <span className="sidebar-badge">{cartItems.length}</span>}
                </NavLink>

                <NavLink to="/income" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-icon"><MdAttachMoney /></span>
                    {!collapsed && <span className="sidebar-label">Income</span>}
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button className="sidebar-link logout-btn" onClick={handleLogout}>
                    <span className="sidebar-icon"><MdLogout /></span>
                    {!collapsed && <span className="sidebar-label">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
