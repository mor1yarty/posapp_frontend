// API設定
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  apiKey: 'pos-flutter-app-2024-secure-key',
};

// アプリ設定
export const APP_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
