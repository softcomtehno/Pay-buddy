/**
 * Воспроизводит звуковой сигнал при успешном сканировании QR-кода
 */
export const playScanSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Настройки звука "пик"
    oscillator.frequency.value = 800; // Частота в Гц
    oscillator.type = 'sine'; // Тип волны

    // Настройки громкости (fade in/out)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    // Очистка после завершения
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Игнорируем ошибки воспроизведения звука
    console.warn('Не удалось воспроизвести звук:', error);
  }
};

