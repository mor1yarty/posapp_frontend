'use client'

import { useState } from 'react';
import axios from 'axios';
import { Product, PurchaseItem, PurchaseResponse } from '@/types';
import './globals.css';

export default function Home() {
  const [productCode, setProductCode] = useState('');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 商品検索
  const searchProduct = async () => {
    if (!productCode.trim()) {
      setErrorMessage('商品コードを入力してください');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.get(`/api/products/${productCode}`);
      
      if (response.data) {
        setCurrentProduct(response.data);
      } else {
        setCurrentProduct(null);
        setErrorMessage('商品がマスタ未登録です');
      }
    } catch (error) {
      console.error('商品検索エラー:', error);
      setErrorMessage('商品検索中にエラーが発生しました');
      setCurrentProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // 購入リストに追加
  const addToPurchaseList = () => {
    if (!currentProduct) {
      setErrorMessage('商品が選択されていません');
      return;
    }

    // 既に同じ商品が購入リストにある場合は数量を増やす
    const existingItemIndex = purchaseList.findIndex(
      item => item.product_id === currentProduct.product_id
    );

    if (existingItemIndex >= 0) {
      const updatedList = [...purchaseList];
      updatedList[existingItemIndex].quantity += 1;
      setPurchaseList(updatedList);
    } else {
      const newItem: PurchaseItem = {
        ...currentProduct,
        quantity: 1
      };
      setPurchaseList([...purchaseList, newItem]);
    }

    // フォームをリセット
    setProductCode('');
    setCurrentProduct(null);
    setErrorMessage('');
    setSuccessMessage('商品を購入リストに追加しました');
  };

  // 購入処理
  const processPurchase = async () => {
    if (purchaseList.length === 0) {
      setErrorMessage('購入商品がありません');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 数量を考慮して商品リストを展開
      const expandedItems = purchaseList.flatMap(item => 
        Array(item.quantity).fill({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.full_name,
          product_price: item.product_price
        })
      );

      const purchaseData = {
        register_staff_code: '9999999999',
        store_code: '30',
        pos_id: '90',
        items: expandedItems
      };

      const response = await axios.post<PurchaseResponse>('/api/purchase', purchaseData);

      if (response.data.success) {
        setSuccessMessage(
          `購入処理が完了しました。合計金額: ¥${response.data.total_amount.toLocaleString()}`
        );
        setPurchaseList([]);
      } else {
        setErrorMessage('購入処理に失敗しました');
      }
    } catch (error) {
      console.error('購入処理エラー:', error);
      setErrorMessage('購入処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 購入リストから商品を削除
  const removeFromPurchaseList = (index: number) => {
    const updatedList = purchaseList.filter((_, i) => i !== index);
    setPurchaseList(updatedList);
  };

  // 合計金額計算
  const totalAmount = purchaseList.reduce(
    (total, item) => total + (item.product_price * item.quantity), 0
  );

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        POSアプリケーション
      </h1>

      <div className="pos-container">
        {/* 商品検索セクション */}
        <div className="section">
          <h2 style={{ marginBottom: '15px' }}>商品検索</h2>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="商品コードを入力してください"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProduct()}
            />
            <button 
              className="button button-primary"
              onClick={searchProduct}
              disabled={loading}
            >
              ① 読み込み
            </button>
          </div>

          {/* 商品情報表示 */}
          {currentProduct && (
            <div className="product-info">
              <div className="info-item">
                <div className="info-label">③ 商品名</div>
                <div className="info-value">{currentProduct.product_name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">色</div>
                <div className="info-value">{currentProduct.color}</div>
              </div>
              <div className="info-item">
                <div className="info-label">品番</div>
                <div className="info-value">{currentProduct.item_code}</div>
              </div>
              <div className="info-item">
                <div className="info-label">④ 単価</div>
                <div className="info-value">¥{currentProduct.product_price.toLocaleString()}</div>
              </div>
              <div className="info-item">
                <div className="info-label">数量</div>
                <div className="info-value">1</div>
              </div>
            </div>
          )}

          {/* 追加ボタン */}
          {currentProduct && (
            <button 
              className="button button-success"
              onClick={addToPurchaseList}
              style={{ width: '100%', marginTop: '10px' }}
            >
              ⑤ 購入リストへ追加
            </button>
          )}
        </div>

        {/* エラー・成功メッセージ */}
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {/* 購入リストセクション */}
        <div className="section">
          <h2 style={{ marginBottom: '15px' }}>⑥ 購入品目リスト</h2>
          <div className="purchase-list">
            <div className="purchase-header">
              <div>商品名</div>
              <div>色</div>
              <div>品番</div>
              <div>数量</div>
              <div>単価</div>
              <div>小計</div>
              <div>操作</div>
            </div>
            {purchaseList.map((item, index) => (
              <div key={index} className="purchase-item">
                <div>{item.product_name}</div>
                <div>{item.color}</div>
                <div>{item.item_code}</div>
                <div>{item.quantity}</div>
                <div>¥{item.product_price.toLocaleString()}</div>
                <div>¥{(item.product_price * item.quantity).toLocaleString()}</div>
                <button 
                  className="button button-warning"
                  onClick={() => removeFromPurchaseList(index)}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  削除
                </button>
              </div>
            ))}
            {purchaseList.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                購入商品がありません
              </div>
            )}
          </div>

          {/* 合計金額 */}
          {purchaseList.length > 0 && (
            <div className="total-section">
              <div className="total-amount">
                合計: ¥{totalAmount.toLocaleString()}
              </div>
            </div>
          )}

          {/* 購入ボタン */}
          <button 
            className="button button-primary"
            onClick={processPurchase}
            disabled={loading || purchaseList.length === 0}
            style={{ 
              width: '100%', 
              marginTop: '15px',
              fontSize: '18px',
              padding: '15px'
            }}
          >
            ⑦ 購入
          </button>
        </div>
      </div>
    </div>
  );
}