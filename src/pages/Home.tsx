import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import BlurText from "@/components/BlurText";
import "@/pages/Home.css";
import TrueFocus from "@/components/TrueFocus";

const Home = () => {
  return (
    <>
      <Navigation />
      <div className="home">
        <section className="hero">
          <div className="hero__content">
            <div className="flex items-center gap-2 justify-center">
              <img
                className="bg-white rounded-lg p-2"
                src="/icons8-деньги-60.png"
                alt="Pay Buddy"
              />
              <TrueFocus
                sentence="Pay Buddy"
                manualMode={false}
                blurAmount={5}
                borderColor="red"
                animationDuration={2}
                pauseBetweenAnimations={1}
              />
            </div>
            <p className="mt-4 text-4xl font-bold mb-8">
              Умное приложение для разделения счетов и управления совместными
              расходами
            </p>
            <p className="hero__description">
              Больше никаких сложных расчетов! Pay Buddy поможет вам легко
              разделить счет в ресторане, рассчитать общие расходы на вечеринке
              или организовать совместные покупки.
            </p>
            <div className="hero__actions">
              <Link
                to="/split"
                className="button button--primary button--large"
              >
                Разделить счёт сейчас
              </Link>
              <Link
                to="/features"
                className="button button--secondary button--large"
              >
                Узнать больше
              </Link>
            </div>
          </div>
        </section>

        <section className="features-preview">
          <div className="container">
            <h2 className="section__title">Почему Pay Buddy?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-card__icon">⚡</div>
                <h3 className="feature-card__title">Быстро и просто</h3>
                <p className="feature-card__description">
                  Разделите счет за несколько кликов. Никаких сложных расчетов
                  вручную.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-card__icon">📱</div>
                <h3 className="feature-card__title">QR-коды для оплаты</h3>
                <p className="feature-card__description">
                  Генерируйте QR-коды для каждого участника. Оплата становится
                  еще проще.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-card__icon">👥</div>
                <h3 className="feature-card__title">
                  Неограниченное количество участников
                </h3>
                <p className="feature-card__description">
                  Добавляйте столько участников, сколько нужно. Подходит для
                  любых компаний.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-card__icon">💳</div>
                <h3 className="feature-card__title">
                  Гибкие режимы разделения
                </h3>
                <p className="feature-card__description">
                  Равномерно или по индивидуальным суммам. Выбирайте удобный
                  способ.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-card__icon">✅</div>
                <h3 className="feature-card__title">Отслеживание оплат</h3>
                <p className="feature-card__description">
                  Видите, кто уже оплатил свою часть, а кому еще нужно
                  напомнить.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-card__icon">🔒</div>
                <h3 className="feature-card__title">Безопасно и приватно</h3>
                <p className="feature-card__description">
                  Все данные хранятся локально. Никакой регистрации и передачи
                  данных третьим лицам.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2 className="cta-section__title">Готовы начать?</h2>
            <p className="cta-section__text">
              Попробуйте Pay Buddy прямо сейчас и убедитесь, насколько это
              просто!
            </p>
            <Link to="/split" className="button button--primary button--large">
              Начать использовать
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
