/**
 * Типы для API запросов сканирования QR-кодов
 */

export interface QRScanRequest {
  url: string;
  timestamp: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: {
    source: string;
    app: string;
  };
}

export interface QRScanResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    processedAt: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}

