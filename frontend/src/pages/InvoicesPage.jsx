import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdVisibility, MdDownload } from 'react-icons/md';
import InvoicePrintView from '../components/InvoicePrintView';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceMode, setInvoiceMode] = useState(''); // 'view' or 'download'

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/invoices');
            setInvoices(data);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleView = (invoice) => {
        setInvoiceMode('view');
        setSelectedInvoice(invoice);
    };

    const handleDownload = (invoice) => {
        setInvoiceMode('download');
        setSelectedInvoice(invoice);
    };

    const handleCloseInvoice = () => {
        setSelectedInvoice(null);
        setInvoiceMode('');
    };

    const filteredInvoices = invoices.filter(invoice =>
        (invoice.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (invoice.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Invoices</h1>
                <p className="page-subtitle">Manage all generated invoices</p>
            </div>

            {/* Search Bar */}
            <div className="search-bar-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by Client Name or Invoice Number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-input"
                    style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner" /></div>
            ) : filteredInvoices.length === 0 ? (
                <div className="empty-state">
                    <p>No invoices found matching your search.</p>
                </div>
            ) : (
                <div className="cart-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice Number</th>
                                <th>Client Name</th>
                                <th>Client Phone</th>
                                <th>Grand Total</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice._id}>
                                    <td className="fw-600 text-primary">{invoice.invoiceNumber}</td>
                                    <td>{invoice.clientName}</td>
                                    <td>{invoice.clientPhone}</td>
                                    <td className="fw-600 text-success">PKR {(invoice.grandTotal || invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleView(invoice)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <MdVisibility /> View
                                            </button>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleDownload(invoice)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <MdDownload /> Download
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Render Invoice Modal for View or Hidden for Download */}
            {selectedInvoice && (
                <InvoicePrintView
                    invoice={selectedInvoice}
                    mode={invoiceMode}
                    onClose={handleCloseInvoice}
                />
            )}
        </div>
    );
};

export default InvoicesPage;
