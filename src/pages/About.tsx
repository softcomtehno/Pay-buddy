import Navigation from '@/components/Navigation';
import '@/pages/About.css';

const About = () => {
  return (
    <>
      <Navigation />
      <div className="about-page">
        <div className="container">
          <div className="about-header">
            <h1 className="about-header__title">О проекте Pay Buddy</h1>
            <p className="about-header__subtitle">
              Простое и удобное решение для разделения счетов
            </p>
          </div>

          <div className="about-content">
            <section className="about-section">
              <h2 className="about-section__title">Наша миссия</h2>
              <p className="about-section__text">
                Pay Buddy создан для того, чтобы сделать разделение счетов максимально простым и удобным. 
                Больше никаких сложных расчетов на салфетках или споров о том, кто сколько должен. 
                Просто введите данные, и приложение сделает все за вас.
              </p>
            </section>

            <section className="about-section">
              <h2 className="about-section__title">Как это работает</h2>
              <p className="about-section__text">
                Pay Buddy использует современные веб-технологии для создания быстрого и отзывчивого интерфейса. 
                Все расчеты происходят локально на вашем устройстве, что гарантирует безопасность и приватность ваших данных. 
                Никакой регистрации, никаких аккаунтов - просто откройте и используйте.
              </p>
            </section>

            <section className="about-section">
              <h2 className="about-section__title">Технологии</h2>
              <div className="tech-stack">
                <div className="tech-item">
                  <strong>React</strong> - современный UI фреймворк
                </div>
                <div className="tech-item">
                  <strong>TypeScript</strong> - типобезопасный JavaScript
                </div>
                <div className="tech-item">
                  <strong>Vite</strong> - быстрый сборщик проектов
                </div>
                <div className="tech-item">
                  <strong>React Router</strong> - маршрутизация
                </div>
              </div>
            </section>

            <section className="about-section">
              <h2 className="about-section__title">Приватность</h2>
              <p className="about-section__text">
                Мы серьезно относимся к вашей приватности. Все данные хранятся только на вашем устройстве. 
                Мы не собираем, не храним и не передаем вашу информацию третьим лицам. 
                Pay Buddy работает полностью офлайн после первой загрузки.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
