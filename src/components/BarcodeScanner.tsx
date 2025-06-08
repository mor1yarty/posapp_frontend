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

  const startScanning = async () => {
    try {
      // カメラアクセス許可の確認と最適な解像度設定
      const constraints = {
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: isMobile ? { ideal: 640, max: 1280 } : { ideal: 1280, max: 1920 },
          height: isMobile ? { ideal: 480, max: 960 } : { ideal: 720, max: 1080 },
          aspectRatio: isMobile ? { ideal: 4/3 } : { ideal: 16/9 }, // デバイスに応じたアスペクト比
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ZXingライブラリでバーコード読み取り開始
      readerRef.current = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        readerRef.current.decodeFromVideoDevice(
          null, // デフォルトデバイス
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
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 text-center">カメラでJANコードをスキャン</h3>
      </div>
      
      {hasPermission === false && (
        <div className="text-center p-4">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">カメラアクセスが必要です</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            JANコードをスキャンするにはカメラへのアクセス許可が必要です。
          </p>
          <button
            onClick={startScanning}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            カメラアクセスを許可
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
          <p className="text-sm text-gray-600 text-center mb-3">
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>赤い枠内</span>にJANコードを合わせてください
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              スキャン停止
            </button>
          </div>
        </div>
      )}
    </div>
  );
}