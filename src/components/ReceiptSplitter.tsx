import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import type { ReceiptData, ReceiptSplitParticipant } from "@/types/receipt";
import { formatCurrency, toNumber } from "@/utils/number";
import Navigation from "@/components/Navigation";
import "@/components/ReceiptSplitter.css";

interface ReceiptSplitterProps {
  receiptData: ReceiptData;
  onClose?: () => void;
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sb_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const splitEqually = (total: number, count: number): number[] => {
  if (count <= 0) {
    return [];
  }
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, index) => {
    const portion = base + (index < remainder ? 1 : 0);
    return portion / 100;
  });
};

const buildPayLink = (
  receiptId: string,
  participantId: string,
  amount: number
) => {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://pay.local";
  return `${base}/pay/${receiptId}/${participantId}?amount=${amount.toFixed(
    2
  )}`;
};

const FakeQr = ({ value }: { value: string }) => {
  const matrix = useMemo(() => {
    const size = 21;
    const matrix: boolean[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));

    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }

    const seed = Math.abs(hash);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const index = (row * size + col + seed) % (value.length || 1);
        matrix[row][col] = (value.charCodeAt(index) + row + col) % 3 === 0;
      }
    }

    return matrix;
  }, [value]);

  return (
    <div className="qr-grid" aria-label="QR код">
      {matrix.map((row, rowIndex) =>
        row.map((filled, colIndex) => (
          <span
            key={`${rowIndex}-${colIndex}`}
            className={
              filled ? "qr-grid__cell qr-grid__cell--filled" : "qr-grid__cell"
            }
          />
        ))
      )}
    </div>
  );
};

const ReceiptSplitter = ({ receiptData, onClose }: ReceiptSplitterProps) => {
  const totalAmount = toNumber(receiptData.sum);
  const [countInput, setCountInput] = useState("2");
  const [mode, setMode] = useState<"equal" | "manual">("equal");
  const [participants, setParticipants] = useState<ReceiptSplitParticipant[]>(
    []
  );

  const handleGenerate = () => {
    const count = parseInt(countInput, 10);
    if (count < 1 || count > 20) {
      alert("Количество участников должно быть от 1 до 20");
      return;
    }

    if (mode === "equal") {
      const shares = splitEqually(totalAmount, count);
      const newParticipants: ReceiptSplitParticipant[] = shares.map(
        (share, index) => {
          const id = createId();
          return {
            id,
            name: `Участник ${index + 1}`,
            amount: share,
            payLink: buildPayLink(receiptData.id, id, share),
            status: "pending",
          };
        }
      );
      setParticipants(newParticipants);
    } else {
      // Режим "Ручной ввод" - создаем участников с пустым списком товаров
      const newParticipants: ReceiptSplitParticipant[] = Array.from(
        { length: count },
        (_, index) => {
          const id = createId();
          return {
            id,
            name: `Участник ${index + 1}`,
            amount: 0,
            payLink: buildPayLink(receiptData.id, id, 0),
            status: "pending",
            selectedProducts: [],
          };
        }
      );
      setParticipants(newParticipants);
    }
  };

  const handleNameChange = (id: string, name: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  // Переключение товара для участника (режим "Ручной ввод")
  const toggleProductForParticipant = (
    participantId: string,
    productId: string
  ) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const currentProducts = p.selectedProducts || [];
          const isSelected = currentProducts.includes(productId);
          const newProducts = isSelected
            ? currentProducts.filter((id) => id !== productId)
            : [...currentProducts, productId];

          // Пересчитываем сумму на основе выбранных товаров
          const newAmount = receiptData.products
            .filter((prod) => newProducts.includes(String(prod.productId)))
            .reduce((sum, prod) => sum + toNumber(prod.productCost), 0);

          return {
            ...p,
            selectedProducts: newProducts,
            amount: newAmount,
            payLink: buildPayLink(receiptData.id, participantId, newAmount),
          };
        }
        return p;
      })
    );
  };

  const handleAmountChange = (id: string, value: string) => {
    // Это используется только для режима "Равные доли" или если нужно вручную скорректировать
    const amount = toNumber(value);
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newAmount = amount;
          return {
            ...p,
            amount: newAmount,
            payLink: buildPayLink(receiptData.id, id, newAmount),
          };
        }
        return p;
      })
    );
  };

  const toggleStatus = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "paid" ? "pending" : "paid" }
          : p
      )
    );
  };

  const handleCopyLink = (participant: ReceiptSplitParticipant) => {
    navigator.clipboard.writeText(participant.payLink);
    alert("Ссылка скопирована!");
  };

  // Экспорт данных в Excel
  const handleExportToExcel = () => {
    if (participants.length === 0) {
      alert("Нет данных для экспорта. Сначала создайте список участников.");
      return;
    }

    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();

    // Лист 1: Информация о чеке
    const receiptInfo = [
      ["Информация о чеке"],
      ["Магазин", receiptData.locationName],
      ["Адрес", receiptData.address],
      ["Кассир", receiptData.cashierName],
      ["Дата", `${receiptData.date} ${receiptData.time}`],
      ["Сумма чека", `${formatCurrency(totalAmount)} сом`],
      ["Режим деления", mode === "equal" ? "Равные доли" : "По товарам"],
      [],
      ["Итого назначено", `${formatCurrency(assignedTotal)} сом`],
      ["Итого оплачено", `${formatCurrency(paidTotal)} сом`],
      [
        "Осталось",
        `${formatCurrency(Math.max(totalAmount - paidTotal, 0))} сом`,
      ],
    ];

    const receiptSheet = XLSX.utils.aoa_to_sheet(receiptInfo);
    XLSX.utils.book_append_sheet(workbook, receiptSheet, "Информация о чеке");

    // Лист 2: Товары
    const productsData = [
      ["№", "Название товара", "Количество", "Цена за шт.", "Сумма"],
      ...receiptData.products.map((product, index) => [
        index + 1,
        product.productName.trim(),
        product.productCount,
        `${formatCurrency(toNumber(product.productPrice))} сом`,
        `${formatCurrency(toNumber(product.productCost))} сом`,
      ]),
      [],
      ["Итого", "", "", "", `${formatCurrency(totalAmount)} сом`],
    ];

    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Товары");

    // Лист 3: Участники
    const participantsData = [
      [
        "№",
        "Имя участника",
        "Сумма",
        "Статус",
        "Ссылка на оплату",
        ...(mode === "manual" ? ["Выбранные товары"] : []),
      ],
      ...participants.map((participant, index) => {
        const row: (string | number)[] = [
          index + 1,
          participant.name,
          `${formatCurrency(participant.amount)} сом`,
          participant.status === "paid" ? "Оплачено" : "Не оплачено",
          participant.payLink,
        ];

        if (mode === "manual" && participant.selectedProducts) {
          const selectedProductsNames = receiptData.products
            .filter((p) =>
              participant.selectedProducts?.includes(String(p.productId))
            )
            .map((p) => p.productName.trim())
            .join(", ");
          row.push(selectedProductsNames || "Нет выбранных товаров");
        }

        return row;
      }),
    ];

    const participantsSheet = XLSX.utils.aoa_to_sheet(participantsData);
    XLSX.utils.book_append_sheet(workbook, participantsSheet, "Участники");

    // Лист 4: Детализация по участникам (только для режима "По товарам")
    if (mode === "manual") {
      participants.forEach((participant, participantIndex) => {
        if (
          participant.selectedProducts &&
          participant.selectedProducts.length > 0
        ) {
          const participantProducts = [
            [`Участник: ${participant.name}`],
            ["Название товара", "Количество", "Цена за шт.", "Сумма"],
            ...receiptData.products
              .filter((p) =>
                participant.selectedProducts?.includes(String(p.productId))
              )
              .map((product) => [
                product.productName.trim(),
                product.productCount,
                `${formatCurrency(toNumber(product.productPrice))} сом`,
                `${formatCurrency(toNumber(product.productCost))} сом`,
              ]),
            [],
            ["Итого", "", "", `${formatCurrency(participant.amount)} сом`],
          ];

          const participantSheet = XLSX.utils.aoa_to_sheet(participantProducts);
          XLSX.utils.book_append_sheet(
            workbook,
            participantSheet,
            `Участник ${participantIndex + 1}`
          );
        }
      });
    }

    // Генерируем имя файла
    const fileName = `Чек_${receiptData.id.slice(-8)}_${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}.xlsx`;

    // Сохраняем файл
    XLSX.writeFile(workbook, fileName);
  };

  const assignedTotal = useMemo(
    () => participants.reduce((sum, p) => sum + p.amount, 0),
    [participants]
  );

  const paidTotal = useMemo(
    () =>
      participants
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0),
    [participants]
  );

  const unpaidParticipants = useMemo(
    () => participants.filter((p) => p.status === "pending").length,
    [participants]
  );

  const difference = totalAmount - assignedTotal;

  const statusBadge = (status: "pending" | "paid") =>
    status === "paid" ? "status-badge status-badge--success" : "status-badge";

  return (
    <>
      <Navigation />
      <div className="receipt-splitter">
        <div className="container">
          <div className="receipt-header">
            <button
              className="button button--secondary"
              onClick={onClose}
              style={{ marginBottom: "1rem" }}
            >
              ← Назад к сканированию
            </button>
            <h1 className="receipt-header__title">
              Чек #{receiptData.id.slice(-8)}
            </h1>
            <div className="receipt-info">
              <div className="receipt-info__row">
                <span className="receipt-info__label">Магазин:</span>
                <span className="receipt-info__value">
                  {receiptData.locationName}
                </span>
              </div>
              <div className="receipt-info__row">
                <span className="receipt-info__label">Адрес:</span>
                <span className="receipt-info__value">
                  {receiptData.address}
                </span>
              </div>
              <div className="receipt-info__row">
                <span className="receipt-info__label">Кассир:</span>
                <span className="receipt-info__value">
                  {receiptData.cashierName}
                </span>
              </div>
              <div className="receipt-info__row">
                <span className="receipt-info__label">Дата:</span>
                <span className="receipt-info__value">
                  {receiptData.date} {receiptData.time}
                </span>
              </div>
              <div className="receipt-info__row">
                <span className="receipt-info__label">Сумма чека:</span>
                <span className="receipt-info__value receipt-info__value--total">
                  {formatCurrency(totalAmount)} сом
                </span>
              </div>
            </div>
          </div>

          <div className="receipt-products">
            <h2 className="receipt-products__title">
              Товары ({receiptData.products.length})
            </h2>
            <div className="receipt-products__list">
              {receiptData.products.map((product, index) => (
                <div key={product.productId} className="receipt-product">
                  <div className="receipt-product__header">
                    <span className="receipt-product__index">#{index + 1}</span>
                    <span className="receipt-product__name">
                      {product.productName.trim()}
                    </span>
                  </div>
                  <div className="receipt-product__details">
                    <span>{product.productCount} шт.</span>
                    <span>
                      × {formatCurrency(toNumber(product.productPrice))} сом
                    </span>
                    <span className="receipt-product__cost">
                      = {formatCurrency(toNumber(product.productCost))} сом
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="split-section">
            <div className="card">
              <h2 className="card-title">Разделить счет</h2>
              <p className="muted">
                {mode === "equal"
                  ? "Разделите чек поровну между участниками"
                  : "Распределите товары по участникам - каждый оплатит только свои покупки"}
              </p>

              <div className="form__section" style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="splitCount">Количество участников</label>
                  <input
                    id="splitCount"
                    type="number"
                    min={1}
                    max={20}
                    inputMode="numeric"
                    value={countInput}
                    onChange={(event) => setCountInput(event.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Режим деления</label>
                  <div className="mode-toggle">
                    <button
                      type="button"
                      className={
                        mode === "equal"
                          ? "mode-toggle__button mode-toggle__button--active"
                          : "mode-toggle__button"
                      }
                      onClick={() => {
                        setMode("equal");
                        setParticipants([]);
                      }}
                    >
                      Равные доли
                    </button>
                    <button
                      type="button"
                      className={
                        mode === "manual"
                          ? "mode-toggle__button mode-toggle__button--active"
                          : "mode-toggle__button"
                      }
                      onClick={() => {
                        setMode("manual");
                        setParticipants([]);
                      }}
                    >
                      По товарам
                    </button>
                  </div>
                </div>
                {mode === "manual" && (
                  <p
                    className="muted"
                    style={{ marginTop: 8, fontSize: "0.9rem" }}
                  >
                    Каждый участник выберет товары, которые он покупал. Сумма
                    будет рассчитана автоматически.
                  </p>
                )}

                <button
                  type="button"
                  className="button button--primary"
                  style={{ marginTop: 8 }}
                  onClick={handleGenerate}
                >
                  Сформировать список участников
                </button>
              </div>
            </div>

            {participants.length > 0 && (
              <div className="card">
                <div className="split-header">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <h3 className="section-title">Участники</h3>
                      <p className="muted">
                        Сформирован {new Date().toLocaleString("ru-RU")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={handleExportToExcel}
                    >
                      📊 Экспорт в Excel
                    </button>
                  </div>
                  <div className="split-summary">
                    <div className="flex items-center gap-2">
                      <span>Сумма чека:</span>
                      <strong>{formatCurrency(totalAmount)} сом</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Назначено:</span>
                      <strong>{formatCurrency(assignedTotal)} сом</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Оплачено:</span>
                      <strong>{formatCurrency(paidTotal)} сом</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Осталось:</span>
                      <strong>
                        {formatCurrency(Math.max(totalAmount - paidTotal, 0))}{" "}
                        сом
                      </strong>
                    </div>
                  </div>
                </div>

                {difference !== 0 && (
                  <div
                    className={
                      difference > 0
                        ? "allocation-alert allocation-alert--pending"
                        : "allocation-alert allocation-alert--error"
                    }
                  >
                    {difference > 0
                      ? `Не хватает распределения ещё на ${formatCurrency(
                          difference
                        )} сом`
                      : `Сумма по участникам превышает чек на ${formatCurrency(
                          Math.abs(difference)
                        )} сом`}
                  </div>
                )}

                <div className="split-participants">
                  {participants.map((participant, index) => (
                    <article
                      key={participant.id}
                      className="split-participant-card"
                    >
                      <div className="split-participant-card__header">
                        <span className="split-participant-card__index">
                          #{index + 1}
                        </span>
                        <input
                          className="split-participant-card__name"
                          value={participant.name}
                          onChange={(event) =>
                            handleNameChange(participant.id, event.target.value)
                          }
                        />
                        <span className={statusBadge(participant.status)}>
                          {participant.status === "paid"
                            ? "Оплачено"
                            : "Не оплачено"}
                        </span>
                      </div>

                      {mode === "manual" ? (
                        <div className="split-participant-card__products">
                          <label>Выберите товары:</label>
                          <div className="products-selection">
                            {receiptData.products.map((product) => {
                              const productId = String(product.productId);
                              const isSelected =
                                participant.selectedProducts?.includes(
                                  productId
                                ) || false;
                              return (
                                <label
                                  key={product.productId}
                                  className="product-checkbox"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      toggleProductForParticipant(
                                        participant.id,
                                        productId
                                      )
                                    }
                                  />
                                  <span className="product-checkbox__label">
                                    <span className="product-checkbox__name">
                                      {product.productName.trim()}
                                    </span>
                                    <span className="product-checkbox__price">
                                      {formatCurrency(
                                        toNumber(product.productCost)
                                      )}{" "}
                                      сом
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="split-participant-card__total">
                            <strong>
                              Итого: {formatCurrency(participant.amount)} сом
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="split-participant-card__row">
                          <label>Сумма</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={participant.amount}
                            onChange={(event) =>
                              handleAmountChange(
                                participant.id,
                                event.target.value
                              )
                            }
                            disabled={mode === "equal"}
                          />
                        </div>
                      )}

                      <div className="split-participant-card__row">
                        <label>Ссылка на оплату</label>
                        <div className="pay-link-cell">
                          <span title={participant.payLink}>
                            {participant.payLink}
                          </span>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => handleCopyLink(participant)}
                          >
                            Копировать
                          </button>
                        </div>
                      </div>

                      <div className="split-participant-card__footer">
                        <FakeQr value={participant.payLink} />
                        <button
                          type="button"
                          className={
                            participant.status === "paid"
                              ? "button button--secondary"
                              : "button button--primary"
                          }
                          onClick={() => toggleStatus(participant.id)}
                        >
                          {participant.status === "paid"
                            ? "Пометить как не оплачено"
                            : "Отметить оплату"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <p className="muted" style={{ marginTop: 12 }}>
                  Не оплатили: {unpaidParticipants} участник(ов). Напомните им
                  вручную, отправив ссылку или показав QR-код.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptSplitter;
