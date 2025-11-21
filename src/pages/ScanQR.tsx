import { useState } from "react";
import Navigation from "@/components/Navigation";
import QRScanner from "@/components/QRScanner";
import ReceiptSplitter from "@/components/ReceiptSplitter";
import type { ReceiptData } from "@/types/receipt";
import "@/pages/ScanQR.css";

interface ScanResult {
  url: string;
  timestamp: string;
  status: "success" | "error" | "pending";
  message?: string;
}

const ScanQR = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const sendToAPI = async (url: string) => {
    setIsSubmitting(true);

    try {
      // Структура POST-запроса - сервер принимает только link
      const requestBody = {
        link: url,
      };

      // URL API из переменной окружения VITE_API_URL
      const API_URL = import.meta.env.VITE_API_URL;

      console.log("=== Начало отправки POST-запроса ===");
      console.log("Отсканированный URL:", url);
      console.log("URL API:", API_URL);
      console.log("Данные для отправки:", JSON.stringify(requestBody, null, 2));
      console.log("=====================================");

      // Проверяем, что URL API установлен
      if (!API_URL || API_URL === "") {
        throw new Error(
          "VITE_API_URL не установлен. Добавьте переменную VITE_API_URL в файл .env"
        );
      }

      console.log("Отправка POST-запроса на:", API_URL);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Добавьте заголовки авторизации, если нужно
          // 'Authorization': 'Bearer YOUR_TOKEN',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Получен ответ от сервера");
      console.log("Статус HTTP:", response.status, response.statusText);
      console.log(
        "Заголовки ответа:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка HTTP:", response.status, response.statusText);
        console.error("Тело ошибки:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();

      // Выводим ответ от сервера в консоль
      console.log("=== Ответ от сервера ===");
      console.log("Статус ответа:", response.status, response.statusText);
      console.log("Данные ответа:", JSON.stringify(data, null, 2));
      console.log("Полный объект ответа:", data);
      console.log("========================");

      // Проверяем, что данные содержат информацию о чеке
      if (data && data.id && data.sum && data.products) {
        // Данные чека получены, показываем интерфейс разделения
        setReceiptData(data as ReceiptData);
        setScanResult({
          url,
          timestamp: new Date().toISOString(),
          status: "success",
          message: "Чек успешно получен. Разделите счет между участниками.",
        });
      } else {
        setScanResult({
          url,
          timestamp: new Date().toISOString(),
          status: "success",
          message: "QR-код успешно отправлен на сервер",
        });
      }
    } catch (error) {
      let errorMessage = "Неизвестная ошибка";
      let userFriendlyMessage = "Произошла ошибка при отправке данных";

      if (error instanceof Error) {
        errorMessage = error.message;

        // Обработка различных типов ошибок
        if (
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Failed to fetch")
        ) {
          userFriendlyMessage =
            "Ошибка сети: не удалось подключиться к серверу. Возможные причины:\n" +
            "• Проблемы с интернет-соединением\n" +
            "• Сервер недоступен\n" +
            "• Проблемы с CORS (Cross-Origin Resource Sharing)\n" +
            "• Неправильный URL API\n\n" +
            "Проверьте настройки API в файле .env (VITE_API_URL)";
        } else if (errorMessage.includes("CORS")) {
          userFriendlyMessage =
            "Ошибка CORS: сервер не разрешает запросы с этого домена. Обратитесь к администратору сервера.";
        } else if (errorMessage.includes("HTTP error")) {
          userFriendlyMessage = `Ошибка сервера: ${errorMessage}`;
        } else {
          userFriendlyMessage = `Ошибка: ${errorMessage}`;
        }
      }

      console.error("Ошибка отправки на сервер:", error);

      setScanResult({
        url,
        timestamp: new Date().toISOString(),
        status: "error",
        message: userFriendlyMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSuccess = (url: string) => {
    console.log("Отсканированный URL:", url);
    setShowScanner(false);
    sendToAPI(url);
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
    setScanResult(null);
    setReceiptData(null);
  };

  const handleCloseReceipt = () => {
    setReceiptData(null);
    setScanResult(null);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  // Если получены данные чека, показываем интерфейс разделения
  if (receiptData) {
    return (
      <ReceiptSplitter receiptData={receiptData} onClose={handleCloseReceipt} />
    );
  }

  return (
    <>
      <Navigation />
      <div className="scan-qr-page">
        <div className="container">
          <div className="scan-qr-header">
            <h1 className="scan-qr-header__title">Сканирование QR-кода</h1>
            <p className="scan-qr-header__subtitle">
              Отсканируйте QR-код для обработки ссылки на оплату
            </p>
          </div>

          <div className="scan-qr-content">
            <div className="scan-qr-card">
              <div className="scan-qr-card__body">
                {!showScanner && (
                  <>
                    <button
                      className="button button--primary button--large"
                      onClick={handleOpenScanner}
                    >
                      📷 Начать сканирование
                    </button>

                    {scanResult && (
                      <div
                        className={`scan-result scan-result--${scanResult.status}`}
                      >
                        <h3 className="scan-result__title">
                          {scanResult.status === "success"
                            ? "✓ Успешно"
                            : "✗ Ошибка"}
                        </h3>
                        <div className="scan-result__content">
                          <p className="scan-result__url">
                            <strong>URL:</strong> {scanResult.url}
                          </p>
                          <p className="scan-result__timestamp">
                            <strong>Время:</strong>{" "}
                            {new Date(scanResult.timestamp).toLocaleString(
                              "ru-RU"
                            )}
                          </p>
                          {scanResult.message && (
                            <p
                              className="scan-result__message"
                              style={{ whiteSpace: "pre-line" }}
                            >
                              {scanResult.message}
                            </p>
                          )}
                        </div>
                        <button
                          className="button button--secondary"
                          onClick={() => setScanResult(null)}
                        >
                          Очистить результат
                        </button>
                      </div>
                    )}

                    {isSubmitting && (
                      <div className="scan-submitting">
                        <p>Отправка данных на сервер...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="scan-qr-info">
              <h3 className="scan-qr-info__title">Как это работает:</h3>
              <ol className="scan-qr-info__list">
                <li>Нажмите кнопку "Начать сканирование"</li>
                <li>Разрешите доступ к камере вашего устройства</li>
                <li>Наведите камеру на QR-код</li>
                <li>После сканирования URL будет отправлен на сервер</li>
                <li>Результат отобразится на экране</li>
              </ol>
            </div>
          </div>
        </div>

        {showScanner && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={handleCloseScanner}
          />
        )}
      </div>
    </>
  );
};

export default ScanQR;
