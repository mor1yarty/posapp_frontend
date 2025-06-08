'use client';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">購入完了</h2>
            <p className="text-gray-600">ありがとうございました</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">税抜金額:</span>
                <span className="text-lg font-semibold">¥{totalAmountExTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">消費税（10%）:</span>
                <span className="text-lg font-semibold">¥{taxAmount.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-semibold">税込合計:</span>
                <span className="text-2xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}