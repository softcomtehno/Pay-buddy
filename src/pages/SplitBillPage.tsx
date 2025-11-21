import { useMemo, useState } from "react";
import type {
  PaymentStatus,
  SplitBillCheck,
  SplitBillParticipant,
  SplitMode,
} from "@/types";
import { formatCurrency, toNumber } from "@/utils/number";
import Navigation from "@/components/Navigation";

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
  checkId: string,
  participantId: string,
  amount: number
) => {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://pay.local";
  return `${base}/pay/${checkId}/${participantId}?amount=${amount.toFixed(2)}`;
};

const createParticipants = (
  checkId: string,
  totalAmount: number,
  count: number,
  mode: SplitMode
): SplitBillParticipant[] => {
  const shares = splitEqually(totalAmount, count);
  return shares.map((share, index) => {
    const amount = mode === "equal" ? share : share;
    const id = createId();
    return {
      id,
      name: `Участник ${index + 1}`,
      amount,
      status: "pending" as PaymentStatus,
      payLink: buildPayLink(checkId, id, amount),
    };
  });
};

const createPatternMatrix = (value: string, size = 21) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  let seed = hash || 1;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      matrix[row][col] = Boolean(seed & 1);
    }
  }

  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const globalRow = startRow + r;
        const globalCol = startCol + c;
        if (globalRow >= size || globalCol >= size) {
          continue;
        }
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[globalRow][globalCol] = isBorder || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  return matrix;
};

const FakeQr = ({ value }: { value: string }) => {
  const matrix = useMemo(() => createPatternMatrix(value), [value]);
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

const SplitBillPage = () => {
  const [totalInput, setTotalInput] = useState("1200");
  const [countInput, setCountInput] = useState("3");
  const [mode, setMode] = useState<SplitMode>("equal");
  const [check, setCheck] = useState<SplitBillCheck | null>(null);

  const participants = check?.participants ?? [];

  const assignedTotal = useMemo(
    () =>
      participants.reduce((sum, participant) => sum + participant.amount, 0),
    [participants]
  );

  const paidTotal = useMemo(
    () =>
      participants
        .filter((participant) => participant.status === "paid")
        .reduce((sum, participant) => sum + participant.amount, 0),
    [participants]
  );

  const unpaidParticipants = participants.filter(
    (participant) => participant.status === "pending"
  ).length;

  const difference = check ? check.totalAmount - assignedTotal : 0;

  const handleGenerate = () => {
    const total = Math.max(0, toNumber(totalInput));
    const count = Math.min(20, Math.max(1, Math.round(toNumber(countInput))));

    if (!total) {
      window.alert("Введите сумму чека.");
      return;
    }

    const checkId = createId();
    const newParticipants = createParticipants(checkId, total, count, mode);

    setCheck({
      id: checkId,
      totalAmount: total,
      participants: newParticipants,
      mode,
      createdAt: new Date().toISOString(),
    });
  };

  const handleModeChange = (nextMode: SplitMode) => {
    setMode(nextMode);
    setCheck((previous) => {
      if (!previous) {
        return previous;
      }
      if (nextMode === "equal") {
        const shares = splitEqually(
          previous.totalAmount,
          previous.participants.length
        );
        const updatedParticipants = previous.participants.map(
          (participant, index) => {
            const amount = shares[index] ?? 0;
            return {
              ...participant,
              amount,
              payLink: buildPayLink(previous.id, participant.id, amount),
            };
          }
        );
        return {
          ...previous,
          mode: nextMode,
          participants: updatedParticipants,
        };
      }
      return { ...previous, mode: nextMode };
    });
  };

  const updateParticipant = (
    participantId: string,
    next: Partial<SplitBillParticipant>
  ) => {
    setCheck((previous) => {
      if (!previous) return previous;

      const updated = previous.participants.map((participant) => {
        if (participant.id !== participantId) return participant;

        // Копируем данные
        const merged: SplitBillParticipant = { ...participant, ...next };

        // Если передана новая сумма — обновляем payLink
        if (next.amount !== undefined) {
          merged.payLink = buildPayLink(
            previous.id,
            participantId,
            merged.amount
          );
        }

        // Если передан статус как string, приводим к PaymentStatus
        if (next.status) {
          merged.status = next.status as PaymentStatus;
        }

        return merged;
      });

      return { ...previous, participants: updated };
    });
  };

  const handleAmountChange = (participantId: string, value: string) => {
    if (!check || check.mode !== "manual") {
      return;
    }
    const amount = Math.max(0, toNumber(value));
    updateParticipant(participantId, { amount });
  };

  const handleNameChange = (participantId: string, value: string) => {
    updateParticipant(participantId, { name: value || "Без имени" });
  };

  const toggleStatus = (participantId: string) => {
    setCheck((previous) => {
      if (!previous) {
        return previous;
      }
      const updated = previous.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              status:
                participant.status === "paid"
                  ? ("pending" as PaymentStatus)
                  : ("paid" as PaymentStatus),
            }
          : participant
      );
      return { ...previous, participants: updated };
    });
  };

  const handleCopyLink = async (participant: SplitBillParticipant) => {
    try {
      await navigator.clipboard.writeText(participant.payLink);
      window.alert("Ссылка скопирована, отправьте её участнику вручную.");
    } catch (error) {
      console.error(error);
      window.alert("Не удалось скопировать ссылку.");
    }
  };

  const statusBadge = (status: PaymentStatus) =>
    status === "paid" ? "status-badge status-badge--success" : "status-badge";

  return (
    <>
      <Navigation />
      <div className="split-grid">
        <section className="card">
          <h2 className="card-title">Сбор оплаты в складчину</h2>
          <p className="muted">
            Разделите чек между друзьями, отправьте каждому ссылку и
            отслеживайте статус оплат без сервера и интеграций.
          </p>

          <div className="form__section" style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="splitTotal">Сумма чека (сом)</label>
              <input
                id="splitTotal"
                type="number"
                min={0}
                inputMode="decimal"
                value={totalInput}
                onChange={(event) => setTotalInput(event.target.value)}
              />
            </div>
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
                  onClick={() => handleModeChange("equal")}
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
                  onClick={() => handleModeChange("manual")}
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
        </section>

        {check ? (
          <section className="card">
            <div className="split-header">
              <div>
                <h3 className="section-title">Чек #{check.id.slice(-6)}</h3>
                <p className="muted">
                  Сформирован{" "}
                  {new Date(check.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div className="split-summary">
                <div>
                  <span>Сумма чека</span>
                  <strong>{formatCurrency(check.totalAmount)} сом</strong>
                </div>
                <div>
                  <span>Назначено по участникам</span>
                  <strong>{formatCurrency(assignedTotal)} сом</strong>
                </div>
                <div>
                  <span>Оплачено</span>
                  <strong>{formatCurrency(paidTotal)} сом</strong>
                </div>
                <div>
                  <span>Осталось</span>
                  <strong>
                    {formatCurrency(Math.max(check.totalAmount - paidTotal, 0))}{" "}
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
                        handleAmountChange(participant.id, event.target.value)
                      }
                      disabled={check.mode === "equal"}
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
          </section>
        ) : (
          <section className="card">
            <p className="muted">
              Сформируйте чек, чтобы увидеть список участников и статусы оплат.
            </p>
          </section>
        )}
      </div>
    </>
  );
};

export default SplitBillPage;
