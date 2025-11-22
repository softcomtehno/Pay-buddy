import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "@/components/Navigation.css";

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__header">
          <div className="flex items-center gap-2 justify-center">
            <img
              className="bg-white rounded-lg p-2"
              src="/icons8-деньги-30.png"
              alt="Pay Buddy"
            />
            <Link to="/" className="navigation__logo" onClick={closeMenu}>
              Pay Buddy
            </Link>
          </div>
          <button
            className={`navigation__burger ${
              isMenuOpen ? "navigation__burger--open" : ""
            }`}
            onClick={toggleMenu}
            aria-label="Меню"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <ul
          className={`navigation__menu ${
            isMenuOpen ? "navigation__menu--open" : ""
          }`}
        >
          <li>
            <Link
              to="/"
              className={`navigation__link ${
                isActive("/") ? "navigation__link--active" : ""
              }`}
              onClick={closeMenu}
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
              onClick={closeMenu}
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
              onClick={closeMenu}
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
              onClick={closeMenu}
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
              onClick={closeMenu}
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
