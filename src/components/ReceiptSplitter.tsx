import { useState, useMemo } from "react";
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

  const handleAmountChange = (id: string, value: string) => {
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
                Разделите чек между участниками для оплаты в складчину
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
                      onClick={() => setMode("equal")}
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
                      onClick={() => setMode("manual")}
                    >
                      Ручной ввод
                    </button>
                  </div>
                </div>

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
                  <div>
                    <h3 className="section-title">Участники</h3>
                    <p className="muted">
                      Сформирован {new Date().toLocaleString("ru-RU")}
                    </p>
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
