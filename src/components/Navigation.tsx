import { Link, useLocation } from "react-router-dom";
import "@/components/Navigation.css";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="flex items-center gap-2 justify-center">
          <img
            className="bg-white rounded-lg p-2"
            src="/icons8-деньги-30.png"
            alt="Pay Buddy"
          />
          <Link to="/" className="navigation__logo">
            Pay Buddy
          </Link>
        </div>
        <ul className="navigation__menu">
          <li>
            <Link
              to="/"
              className={`navigation__link ${
                isActive("/") ? "navigation__link--active" : ""
              }`}
            >
              Главная
            </Link>
          </li>
          <li>
            <Link
              to="/scan"
              className={`navigation__link ${
                isActive("/scan") ? "navigation__link--active" : ""
              }`}
            >
              Сканировать QR-код
            </Link>
          </li>
          <li>
            <Link
              to="/split"
              className={`navigation__link ${
                isActive("/split") ? "navigation__link--active" : ""
              }`}
            >
              Разделить счёт
            </Link>
          </li>
          <li>
            <Link
              to="/features"
              className={`navigation__link ${
                isActive("/features") ? "navigation__link--active" : ""
              }`}
            >
              Возможности
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={`navigation__link ${
                isActive("/about") ? "navigation__link--active" : ""
              }`}
            >
              О проекте
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
