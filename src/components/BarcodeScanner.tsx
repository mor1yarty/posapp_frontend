'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // モバイル判定
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      setIsMobile(window.innerWidth <= 640 || isIOS);
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
      
      // デバイス判定
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac/.test(userAgent) && !isIOS;
      const isHTTPS = location.protocol === 'https:';
      
      // iOS Safari HTTPS要件チェック
      if (isIOS && !isHTTPS) {
        onScanError('iOS Safari ではHTTPS環境が必要です。https://で接続してください。');
        return;
      }
      
      // Apple デバイス対応のプログレッシブ制約
      const constraintOptions: MediaStreamConstraints[] = [];
      
      // iPhone/iPad 背面カメラ用
      if (isIOS) {
        constraintOptions.push({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 640, min: 320, max: 1280 },
            height: { ideal: 480, min: 240, max: 720 },
          }
        });
      }
      
      // iPhone/iPad フロントカメラフォールバック
      if (isIOS) {
        constraintOptions.push({
          video: {
            facingMode: 'user',
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
          }
        });
      }
      
      // Mac カメラ用（facingMode指定なし）
      if (isMacOS) {
        constraintOptions.push({
          video: {
            width: { ideal: 640, min: 320, max: 1280 },
            height: { ideal: 480, min: 240, max: 720 },
          }
        });
      }
      
      // 汎用制約（フォールバック）
      constraintOptions.push({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
        }
      });
      
      // 最終フォールバック
      constraintOptions.push({ video: true });
      
      let stream = null;
      let constraintIndex = 0;
      
      // 制約を段階的に試行
      while (!stream && constraintIndex < constraintOptions.length) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraintOptions[constraintIndex]);
          console.log(`Constraint ${constraintIndex} succeeded:`, constraintOptions[constraintIndex]);
        } catch (err) {
          console.warn(`Constraint ${constraintIndex} failed:`, err);
          constraintIndex++;
          if (constraintIndex >= constraintOptions.length) {
            throw err;
          }
        }
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // カメラ情報の取得
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          console.log('Camera settings:', settings);
          
          // iOS Safari 特有の設定
          if (isIOS) {
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.setAttribute('playsinline', 'true');
            // iOS Safari でビデオ再生を強制
            videoRef.current.play().catch(console.error);
          }
        }
      }

      // Apple デバイス最適化 ZXing設定
      readerRef.current = new BrowserMultiFormatReader();
      
      // デバイス別読み取り間隔調整
      if (isIOS) {
        // iOS Safari は処理が重いため間隔を長く
        readerRef.current.timeBetweenDecodingAttempts = 300;
      } else if (isMacOS) {
        // Mac Safari は中間的な設定
        readerRef.current.timeBetweenDecodingAttempts = 200;
      } else {
        // その他デバイス
        readerRef.current.timeBetweenDecodingAttempts = 150;
      }
      
      if (videoRef.current) {
        // Apple デバイス最適化スキャンコールバック
        const handleScanResult = (result: any, error: any) => {
          // 既に処理中の場合は無視
          if (isProcessingRef.current) return;
          
          if (!result) {
            // "No MultiFormat Readers were able to detect the code" は正常動作
            if (error && error.message !== 'No MultiFormat Readers were able to detect the code') {
              console.log('ZXing error:', error.message);
            }
            return;
          }
          
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
      
      // Apple デバイス用タイムアウト調整
      const timeoutDuration = isIOS ? 15000 : isMacOS ? 12000 : 10000; // iOS:15秒, Mac:12秒, その他:10秒
      timeoutRef.current = setTimeout(() => {
        if (!isProcessingRef.current) {
          const deviceHint = isIOS 
            ? 'カメラをバーコードに近づけて、明るい場所で再試行してください。'
            : isMacOS 
            ? 'バーコードとの距離を調整して再試行してください。'
            : '再度お試しください。';
          onScanError(`読み取りタイムアウト（${timeoutDuration/1000}秒）。${deviceHint}`);
          stopScanning();
        }
      }, timeoutDuration);
      
    } catch (error) {
      console.error('カメラエラー:', error);
      setHasPermission(false);
      
      if (error instanceof Error) {
        // Apple デバイス特有のエラーハンドリング
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isMacOS = /Mac/.test(userAgent) && !isIOS;
        const isHTTPS = location.protocol === 'https:';
        
        if (error.name === 'NotAllowedError') {
          if (isIOS && !isHTTPS) {
            onScanError('iOS Safari ではHTTPS環境が必要です。https://で接続してください。');
          } else if (isIOS) {
            onScanError('カメラアクセスが拒否されました。Safari の設定 > Webサイト > カメラ でアクセスを許可してください。');
          } else if (isMacOS) {
            onScanError('カメラアクセスが拒否されました。システム環境設定 > セキュリティとプライバシー > カメラ でSafariを許可してください。');
          } else {
            onScanError('カメラアクセスが拒否されました。ブラウザ設定でカメラアクセスを許可してください。');
          }
        } else if (error.name === 'NotFoundError') {
          if (isIOS) {
            onScanError('カメラが見つかりません。デバイスのカメラが利用可能か確認してください。');
          } else if (isMacOS) {
            onScanError('カメラが見つかりません。他のアプリケーションでカメラを使用していないか確認してください。');
          } else {
            onScanError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
          }
        } else if (error.name === 'OverconstrainedError') {
          onScanError('カメラ設定エラー。このデバイスはカメラ機能をサポートしていません。');
        } else if (error.name === 'NotReadableError') {
          if (isIOS || isMacOS) {
            onScanError('カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。');
          } else {
            onScanError('カメラが他のアプリケーションで使用中です。');
          }
        } else {
          onScanError(`カメラエラー: ${error.message}`);
        }
      } else {
        onScanError('予期しないエラーが発生しました。ページを再読み込みしてお試しください。');
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
              onLoadedMetadata={() => {
                // iOS Safari 特有の処理
                const userAgent = navigator.userAgent;
                const isIOS = /iPad|iPhone|iPod/.test(userAgent);
                if (videoRef.current && isIOS) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onError={(e) => {
                console.error('Video error:', e);
              }}
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