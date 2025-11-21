import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { playScanSound } from "@/utils/sound";
import "@/components/QRScanner.css";

interface QRScannerProps {
  onScanSuccess: (url: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef(`qr-reader-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const isInitializedRef = useRef(false);

  const stopScanning = useCallback(async () => {
    // Останавливаем сканер
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        if (scannerState === 2) {
          // Html5QrcodeScannerState.SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        // Игнорируем ошибки при остановке
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }

    // Останавливаем все активные потоки камеры через video элементы
    if (containerRef.current) {
      const videoElements = containerRef.current.querySelectorAll('video');
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    }

    // Очищаем элемент
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }
  }, []);

  useEffect(() => {
    // Предотвращаем двойной запуск в StrictMode
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    let isMounted = true;

    const startScanning = async () => {
      // Останавливаем предыдущий экземпляр, если он существует
      await stopScanning();

      // Небольшая задержка для полной очистки
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Очищаем элемент перед созданием нового сканера
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }

      if (!isMounted || !containerRef.current) {
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(containerIdRef.current);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Успешное сканирование
            if (isMounted) {
              console.log("Отсканированный URL:", decodedText);
              // Воспроизводим звуковой сигнал
              playScanSound();
              onScanSuccess(decodedText);
              stopScanning();
            }
          },
          () => {
            // Игнорируем ошибки поиска QR-кода (это нормально)
          }
        );

        if (isMounted) {
          setIsScanning(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Неизвестная ошибка";
          setError(`Ошибка запуска камеры: ${errorMessage}`);
          console.error("Ошибка сканирования:", err);
        }
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      isInitializedRef.current = false;
      stopScanning();
    };
  }, [onScanSuccess, stopScanning]);

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-modal__backdrop" onClick={handleClose}></div>
      <div className="qr-scanner-modal__content">
        <div className="qr-scanner-modal__header">
          <h2 className="qr-scanner-modal__title">Сканирование QR-кода</h2>
          <button
            className="qr-scanner-modal__close"
            onClick={handleClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="qr-scanner-modal__body">
          {error && (
            <div className="qr-scanner-error">
              <p>{error}</p>
              <p className="qr-scanner-error__hint">
                Убедитесь, что вы предоставили доступ к камере
              </p>
            </div>
          )}

          <div 
            ref={containerRef}
            id={containerIdRef.current}
            className="qr-reader"
          ></div>

          {isScanning && (
            <p className="qr-scanner-hint">
              Наведите камеру на QR-код для сканирования
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

