import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const InvoicePrintView = ({ invoice, mode = 'auto-download', onClose }) => {
    const invoiceRef = useRef(null);
    const [generating, setGenerating] = useState(mode === 'auto-download' || mode === 'download');

    useEffect(() => {
        const generatePdf = async () => {
            if (!invoiceRef.current) return;
            if (mode === 'view') return; // Do not auto-generate in view mode
            setGenerating(true);
            try {
                // Optional small delay to ensure rendering is strictly complete
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await html2canvas(invoiceRef.current, {
                    scale: 2, // higher scale for better resolution 
                    useCORS: true,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');

                // A4 landscape? No, A4 portrait
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                const dateStr = formatDate(invoice.createdAt);
                pdf.save(`invoice-${dateStr}-${invoice.invoiceNumber}.pdf`);

            } catch (err) {
                console.error("Error generating PDF:", err);
                alert("Failed to generate PDF automatically.");
            } finally {
                setGenerating(false);
                if (mode === 'auto-download' || mode === 'download') {
                    onClose();
                }
            }
        };

        generatePdf();
    }, [invoice, mode, onClose]);

    const handleManualDownload = async () => {
        if (!invoiceRef.current) return;
        setGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const dateStr = formatDate(invoice.createdAt);
            pdf.save(`invoice-${dateStr}-${invoice.invoiceNumber}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate PDF automatically.");
        } finally {
            setGenerating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const isHiddenRender = mode === 'auto-download' || mode === 'download';

    return (
        <div className={!isHiddenRender ? "invoice-print-container" : ""} style={isHiddenRender ? {
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none'
        } : {
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#f1f5f9',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '20px'
        }}>

            {!isHiddenRender && (
                <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                    <button
                        onClick={handleManualDownload}
                        disabled={generating}
                        style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '5px', cursor: generating ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                    >
                        {generating ? 'Downloading...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                    >
                        Close
                    </button>
                </div>
            )}

            <div ref={invoiceRef} className="invoice-paper" style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                padding: '40px 50px',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                color: '#333'
            }}>
                <style>
                    {`
                        @media print {
                            body * { visibility: hidden; }
                            .invoice-print-container { background: transparent !important; padding: 0 !important; }
                            .invoice-paper, .invoice-paper * { visibility: visible; }
                            .invoice-paper { position: absolute; left: 0; top: 0; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 20px !important; }
                            .no-print { display: none !important; }
                        }
                    `}
                </style>

                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: '#0A1A3A',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#F59E0B',
                        fontWeight: 'bold'
                    }}>
                        <span style={{ fontSize: '50px', lineHeight: '1' }}>A</span>
                        <span style={{ fontSize: '8px', color: '#60A5FA', textAlign: 'center', marginTop: '5px' }}>AK Mobile, Laptop & CCTV<br />Camera Center</span>
                    </div>
                    <div>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>AK Mobile, Laptop & CCTV House Sambrial</h1>
                        <p style={{ margin: '0', fontSize: '14px', color: '#4B5563', lineHeight: '1.4' }}>
                            More Masjid Sambrial, Majrad Road Opposite Muskan Photo Studio<br />
                            03175202915<br />
                            aftabahme7582@gmail.com<br />
                            03252041662
                        </p>
                    </div>
                </div>

                <hr style={{ borderTop: '2px solid #E5E7EB', margin: '20px 0' }} />

                {/* INVOICE Title */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: '0', fontSize: '28px', color: '#374151', letterSpacing: '2px' }}>INVOICE</h2>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '80px' }}>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Bill To</strong>
                            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.4' }}>
                                <strong>{invoice.clientName}</strong><br />
                                {invoice.clientPhone}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6', marginBottom: '5px' }}>
                            {invoice.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '14px', color: '#3B82F6' }}>
                            {formatDate(invoice.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#60A5FA', color: '#fff' }}>
                            <th style={{ padding: '8px', textAlign: 'center', width: '50px', fontSize: '14px' }}>Sr no.</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px' }}>Product</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '80px', fontSize: '14px' }}>Qty</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '120px', fontSize: '14px' }}>Rate</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '120px', fontSize: '14px' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.products.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{index + 1}</td>
                                <td style={{ padding: '8px', textAlign: 'left', fontSize: '13px' }}>{item.productName}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{item.quantity.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{item.salePricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{item.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <div style={{ width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #60A5FA', paddingBottom: '5px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                            Please Note
                        </div>
                    </div>

                    <div style={{ width: '40%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Total</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Rs {(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                {invoice.discountAmount > 0 && (
                                    <tr>
                                        <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>(-) Discount</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: 'red' }}>Rs {invoice.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                                <tr style={{ backgroundColor: '#60A5FA', color: '#fff' }}>
                                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Grand Total</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Rs {(invoice.grandTotal || invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '6px 8px' }}>Balance</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>Rs {((invoice.remainingAmount !== undefined) ? invoice.remainingAmount : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment History & Signature */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', paddingRight: '20px' }}>
                    <div style={{ width: '40%', paddingLeft: '50px' }}>
                        {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #E5E7EB', paddingBottom: '5px' }}>Payment History</h4>
                                {invoice.paymentHistory.map((pmt, idx) => (
                                    <div key={idx} style={{ fontSize: '13px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Paid ({formatDate(pmt.date)})</span>
                                        <span style={{ fontWeight: 'bold' }}>Rs {pmt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        {/* Simple SVG to mimic a cursive signature 'A' */}
                        <svg width="100" height="40" viewBox="0 0 100 40">
                            <path d="M 20 30 C 30 15, 45 5, 55 10 C 60 15, 60 25, 40 30 C 60 30, 80 20, 90 20" stroke="#000" strokeWidth="1.5" fill="none" />
                            <path d="M 40 25 L 70 20" stroke="#000" strokeWidth="1.5" fill="none" />
                        </svg>
                        <div style={{ borderTop: 'none', paddingTop: '5px', fontSize: '13px' }}>
                            Aftab Ahmed<br />
                            <strong>Signature</strong>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoicePrintView;
