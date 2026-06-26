import React, { useEffect } from 'react';
import './InvoiceStyle.css';

const Invoice = ({ order, disablePrint = false, forceDesktop = false }) => {
  useEffect(() => {
    if (order && !disablePrint) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [order, disablePrint]);

  if (!order) return null;

  // Helper to format currency
  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to convert number to words (simple version)
  const numberToWords = (num) => {
    // This is a placeholder. For a real app, use a library like 'number-to-words'
    return "Six Hundred Ninety-Four and Sixteen Paise Only"; 
  };

  const invoiceDate = order.payment_done_date ? new Date(order.payment_done_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'N/A';

  return (
    <div className={`invoice-container ${forceDesktop ? 'force-desktop' : ''}`}>
      {/* Header */}
      <div className="invoice-header">
        <div className="logo-section">
          <img src="/migfulllogo.svg" alt="MIG" className="invoice-logo" />
        </div>
        <div className="header-title">
          <h1>TAX INVOICE</h1>
          <p>Original for Recipient</p>
        </div>
      </div>

      <div className="purple-line"></div>

      {/* From & Invoice Details */}
      <div className="top-section">
        <div className="from-details">
          <span className="label-purple">FROM:</span>
          <h3>Medingen</h3>
          <p>No.16, Ground Floor, School Street,</p>
          <p>Mangadu, Chennai 600 122.</p>
          <div className="gst-dl">
            <p>
              <strong>GSTIN:</strong> 22AAAAA0000A1Z5<br />
              <strong>DL No:</strong> KA-BNG-123456<br />
              <strong>Phone:</strong> +91 70901 23709
            </p>
          </div>
        </div>
        <div className="invoice-meta-box">
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">INVOICE NUMBER</span>
              <span className="meta-value">INV-2023-10-{order.order_id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">DATE OF ISSUE</span>
              <span className="meta-value">{invoiceDate}</span>
            </div>
          </div>
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">ORDER ID</span>
              <span className="meta-value">{order.custom_order_id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">PLACE OF SUPPLY</span>
              <span className="meta-value">{order.address.state}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="billing-section">
        <div className="bill-ship-box">
          <div className="bill-to">
            <div className="section-title-purple">
              <i className="fi fi-rr-document"></i> BILL TO:
            </div>
            <div className="addr-card">
              <h4>{order.address.name}</h4>
              <p>
                {order.address.line1 && <>{order.address.line1}<br /></>}
                {order.address.line2 && <>{order.address.line2}<br /></>}
                {order.address.state} - {order.address.pincode}
                <br /><br />
                <strong>Phone:</strong> +91 {order.address.phone}
              </p>
            </div>
          </div>
          <div className="ship-to">
            <div className="section-title-purple">
              <i className="fi fi-rr-truck-side"></i> SHIP TO:
            </div>
            <div className="addr-card">
              <h4>{order.address.name}</h4>
              <p>
                {order.address.line1 && <>{order.address.line1}<br /></>}
                {order.address.line2 && <>{order.address.line2}<br /></>}
                {order.address.state} - {order.address.pincode}
                <br /><br />
                <strong>Phone:</strong> +91 {order.address.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>S.NO</th>
            <th className="desc-col">ITEM DESCRIPTION</th>
            <th>HSN</th>
            <th>QTY</th>
            <th>RATE</th>
            <th>DISC.</th>
            <th>GST %</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index}>
              <td>{(index + 1).toString().padStart(2, '0')}</td>
              <td className="desc-col">
                <div className="item-name-bold">{item.name}</div>
              </td>
              <td>3004</td>
              <td>{item.quantity}</td>
              <td>{item.price_per_unit.toFixed(2)}</td>
              <td>10%</td>
              <td>12%</td>
              <td className="item-total-bold">{item.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="amount-words">
          <span className="label-gray">AMOUNT IN WORDS</span>
          <p className="words-text">{numberToWords(order.orderSummary.totalAmount)}</p>
          
          <div className="terms-box">
            <h4>TERMS & CONDITIONS</h4>
            <ul>
              <li>Medicines cannot be returned once the seal is broken.</li>
              <li>Temperature-sensitive products are non-returnable.</li>
              <li>Goods once sold will not be taken back.</li>
              <li>Subject to Bangalore Jurisdiction only.</li>
            </ul>
          </div>
        </div>
        <div className="summary-box">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.orderSummary.total_selling_price)}</span>
          </div>
          <div className="summary-row discount">
            <span>Total Discount</span>
            <span>-{formatCurrency(order.orderSummary.totalSavings)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery Charges</span>
            <span>{formatCurrency(order.orderSummary.total_shipping_charge)}</span>
          </div>
          <div className="summary-row">
            <span>GST Total</span>
            <span>{formatCurrency(order.orderSummary.total_cod_charge)}</span> {/* Placeholder for GST if not split in API */}
          </div>
          <div className="grand-total-row">
            <span>Grand Total</span>
            <span className="grand-total-val">{formatCurrency(order.orderSummary.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="invoice-footer">
        <div className="footer-notes">
          <p><strong>Note:</strong></p>
          <p>This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
        <div className="signatory-section">
          <img src="/signature.png" alt="Authorized Signatory" className="signature-stamp" />
          <div className="sign-line"></div>
          <h4>AUTHORIZED SIGNATORY</h4>
          <p>FOR MEDINGEN</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
