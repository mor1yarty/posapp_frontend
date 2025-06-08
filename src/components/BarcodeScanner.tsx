'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  BrowserMultiFormatReader, 
  BrowserCodeReader,
  DecodeHintType,
  BarcodeFormat 
} from '@zxing/library';

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
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

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
          width: isMobile ? { ideal: 1280, max: 1920 } : { ideal: 1920, max: 2560 },
          height: isMobile ? { ideal: 720, max: 1080 } : { ideal: 1080, max: 1440 },
          aspectRatio: isMobile ? { ideal: 16/9 } : { ideal: 16/9 }, // 統一したアスペクト比
          focusMode: 'continuous', // 連続オートフォーカス
          exposureMode: 'continuous', // 連続露出調整
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // ビデオが再生準備完了まで待機
        await new Promise((resolve) => {
          videoRef.current!.addEventListener('loadedmetadata', resolve, { once: true });
        });
      }

      // ZXingライブラリの高精度設定
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      readerRef.current = new BrowserMultiFormatReader(hints);
      
      if (videoRef.current) {
        let scanCount = 0;
        const maxScans = 100; // 最大スキャン回数制限
        
        readerRef.current.decodeFromVideoDevice(
          null, // デフォルトデバイス
          videoRef.current,
          (result, error) => {
            scanCount++;
            const progress = Math.min((scanCount / maxScans) * 100, 100);
            setScanProgress(progress);
            
            if (result) {
              // バーコード読み取り成功
              const code = result.getText();
              console.log('バーコード読み取り成功:', code, 'スキャン回数:', scanCount);
              
              // JANコード（EAN-13, EAN-8）の妥当性チェック
              if ((code.length === 13 || code.length === 8) && /^\d+$/.test(code)) {
                setScanProgress(100);
                onScanSuccess(code);
                stopScanning();
              } else if (code.length === 12 && /^\d{12}$/.test(code)) {
                // UPC-A (12桁) を EAN-13 (13桁) に変換
                const eanCode = '0' + code;
                console.log('UPC-A をEAN-13に変換:', code, '->', eanCode);
                setScanProgress(100);
                onScanSuccess(eanCode);
                stopScanning();
              } else {
                console.log('無効なコード形式:', code, '長さ:', code.length);
              }
            }
            
            if (error && !(error.name === 'NotFoundException')) {
              console.error('バーコード読み取りエラー:', error, 'スキャン回数:', scanCount);
              
              // 一定回数エラーが続いた場合のみユーザーに通知
              if (scanCount > 50 && scanCount % 25 === 0) {
                onScanError(`読み取りが困難です。バーコードを枠内に合わせ、明るい場所で再度お試しください。`);
              }
            }
            
            // 最大スキャン回数に達した場合は停止
            if (scanCount >= maxScans) {
              console.log('最大スキャン回数に達しました');
              setScanProgress(100);
              onScanError('読み取りタイムアウト。バーコードを確認して再度お試しください。');
              stopScanning();
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
    
    // プログレスリセット
    setScanProgress(0);
  };

  const handleManualSubmit = () => {
    if (manualCode.length === 13 && /^\d{13}$/.test(manualCode)) {
      onScanSuccess(manualCode);
      setManualCode('');
      setShowManualInput(false);
      stopScanning();
    } else if (manualCode.length === 8 && /^\d{8}$/.test(manualCode)) {
      onScanSuccess(manualCode);
      setManualCode('');
      setShowManualInput(false);
      stopScanning();
    } else {
      alert('有効なJANコード（8桁または13桁の数字）を入力してください。');
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
          <div className="mb-3">
            <p className="text-sm text-gray-600 text-center mb-2">
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>赤い枠内</span>にJANコードを合わせてください
            </p>
            
            {/* スキャン進捗バー */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              スキャン中... {Math.round(scanProgress)}%
              <br />
              <span className="text-amber-600">💡 明るい場所で、バーコードを水平に保持してください</span>
            </p>
          </div>
          {showManualInput ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">手動でJANコードを入力</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="JANコード（8桁または13桁）"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  maxLength={13}
                />
                <button
                  onClick={handleManualSubmit}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  検索
                </button>
              </div>
              <button
                onClick={() => setShowManualInput(false)}
                className="text-sm text-gray-600 underline mt-2"
              >
                カメラスキャンに戻る
              </button>
            </div>
          ) : null}
          
          <div className="flex justify-center gap-2">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              スキャン停止
            </button>
            <button
              onClick={() => setShowManualInput(true)}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            >
              手動入力
            </button>
          </div>
        </div>
      )}
    </div>
  );
}