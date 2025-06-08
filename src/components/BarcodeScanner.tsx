'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useDebounce } from 'react-use';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // モバイル判定
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

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

  const startScanning = useCallback(async () => {
    try {
      // 処理状態をリセット
      isProcessingRef.current = false;
      setHasPermission(true);
      
      // シンプルなカメラ制約（高速化重視）
      const constraints = {
        video: {
          facingMode: 'environment', // 背面カメラ優先
          width: { ideal: 640 }, // 固定解像度で高速化
          height: { ideal: 480 },
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // シンプルなZXing設定
      readerRef.current = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        // 高速スキャンコールバック（最小限）
        const handleScanResult = (result: any, error: any) => {
          // 既に処理中の場合は無視
          if (isProcessingRef.current) return;
          if (!result) return;
          if (error) return;
          
          const code = result.getText();
          console.log('バーコード検出:', code);
          
          // JANコード即座検証
          if ((code.length === 13 || code.length === 8) && /^\d+$/.test(code)) {
            isProcessingRef.current = true; // 処理中フラグをセット
            
            // タイムアウトをクリア
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            // スキャンを停止してから成功処理
            stopScanning();
            onScanSuccess(code);
            
          } else if (code.length === 12 && /^\d{12}$/.test(code)) {
            isProcessingRef.current = true; // 処理中フラグをセット
            
            // タイムアウトをクリア
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            const eanCode = '0' + code;
            // スキャンを停止してから成功処理
            stopScanning();
            onScanSuccess(eanCode);
          }
        };
        
        // 参考記事と同様のシンプルな実装
        readerRef.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          handleScanResult
        );
      }
      
      // 10秒でタイムアウト（タイムアウト参照を保存）
      timeoutRef.current = setTimeout(() => {
        if (!isProcessingRef.current) { // 成功処理中でない場合のみタイムアウト処理
          onScanError('読み取りタイムアウト。再度お試しください。');
          stopScanning();
        }
      }, 10000);
      
    } catch (error) {
      console.error('カメラエラー:', error);
      setHasPermission(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onScanError('カメラアクセスが拒否されました。');
        } else if (error.name === 'NotFoundError') {
          onScanError('カメラが見つかりません。');
        } else {
          onScanError('カメラエラーが発生しました。');
        }
      }
    }
  }, [onScanSuccess, onScanError]);

  const stopScanning = useCallback(() => {
    // タイムアウトのクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

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

    // 処理状態をリセット
    isProcessingRef.current = false;
  }, []);


  if (!isScanning) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 text-center">🚀 高速JANスキャン</h3>
        <p className="text-sm text-gray-600 text-center mt-1">カメラでバーコードを読み取ります</p>
      </div>
      
      {hasPermission === false && (
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            <p className="font-bold text-lg">カメラアクセス許可が必要です</p>
          </div>
          <button
            onClick={startScanning}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
          >
            📷 カメラを有効にする
          </button>
        </div>
      )}
      
      {hasPermission !== false && (
        <div>
          <div className="barcode-scanner-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="barcode-video"
            />
            <div className="barcode-scanner-frame"></div>
            {/* フォールバック枠（CSSが効かない場合用） */}
            <div 
              className="barcode-fallback-frame"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isMobile ? '140px' : '160px',
                height: isMobile ? '84px' : '96px',
                border: isMobile ? '2px solid #ef4444' : '3px solid #ef4444',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: isMobile 
                  ? '0 0 0 1px rgba(239, 68, 68, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.8)'
                  : '0 0 0 2px rgba(239, 68, 68, 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.8)'
              }}
            ></div>
          </div>
          <div className="mb-3">
            <p className="text-sm text-gray-600 text-center mb-2">
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>赤い枠内</span>にJANコードを合わせてください
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 font-semibold"
            >
              スキャン停止
            </button>
          </div>
        </div>
      )}
    </div>
  );
}