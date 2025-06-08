'use client';

import { useEffect } from 'react';

interface TaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  totalAmountExTax: number;
  taxAmount: number;
}

export default function TaxModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  totalAmountExTax, 
  taxAmount 
}: TaxModalProps) {
  // モーダル表示時のスクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // クリーンアップ
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <div className="purchase-success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="purchase-success-title">購入完了</h2>
          <p className="purchase-success-subtitle">ありがとうございました</p>
        </div>

        <div className="tax-breakdown">
          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">税抜金額:</span>
            <span className="tax-breakdown-value">¥{totalAmountExTax.toLocaleString()}</span>
          </div>
          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">消費税（10%）:</span>
            <span className="tax-breakdown-value">¥{taxAmount.toLocaleString()}</span>
          </div>
          <div className="tax-breakdown-item">
            <span className="tax-breakdown-total-label">税込合計:</span>
            <span className="tax-breakdown-total-value">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="modal-close-button"
        >
          OK
        </button>
      </div>
    </div>
  );
}