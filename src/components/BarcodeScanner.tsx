'use client';

import { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onScanError: (error: string) => void;
  isScanning: boolean;
  onClose: () => void;
}

export default function BarcodeScanner({ 
  onScanSuccess, 
  onScanError, 
  isScanning, 
  onClose 
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      // カメラアクセス許可の確認
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 背面カメラを優先
      });
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ZXingライブラリでバーコード読み取り開始
      readerRef.current = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        readerRef.current.decodeFromVideoDevice(
          undefined, // デフォルトデバイス
          videoRef.current,
          (result, error) => {
            if (result) {
              // バーコード読み取り成功
              const code = result.getText();
              console.log('バーコード読み取り成功:', code);
              onScanSuccess(code);
              stopScanning();
            }
            if (error && !(error.name === 'NotFoundException')) {
              // エラー（NotFoundException以外）
              console.error('バーコード読み取りエラー:', error);
              onScanError(`読み取りエラー: ${error.message}`);
            }
          }
        );
      }
    } catch (error) {
      console.error('カメラアクセスエラー:', error);
      setHasPermission(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onScanError('カメラへのアクセスが拒否されました。ブラウザ設定でカメラアクセスを許可してください。');
        } else if (error.name === 'NotFoundError') {
          onScanError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        } else if (error.name === 'NotSupportedError') {
          onScanError('このブラウザではカメラアクセスがサポートされていません。HTTPS接続を確認してください。');
        } else {
          onScanError(`カメラエラー: ${error.message}`);
        }
      } else {
        onScanError('不明なカメラエラーが発生しました。');
      }
    }
  };

  const stopScanning = () => {
    // ZXingリーダーの停止
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }

    // ビデオストリームの停止
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  if (!isScanning) {
    return null;
  }

  return (
    <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">JANコードスキャン</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {hasPermission === false && (
          <div className="text-center p-4">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              カメラアクセスが必要です
            </div>
            <p className="text-sm text-gray-600 mb-4">
              JANコードをスキャンするにはカメラへのアクセス許可が必要です。
              ブラウザの設定でカメラアクセスを許可してください。
            </p>
            <button
              onClick={startScanning}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              再試行
            </button>
          </div>
        )}
        
        {hasPermission !== false && (
          <div className="text-center">
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-red-500 rounded"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              赤い枠内にJANコードを合わせてください
            </p>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}