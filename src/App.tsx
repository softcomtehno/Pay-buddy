import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Ленивая загрузка страниц
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Features = lazy(() => import("@/pages/Features"));
const SplitBillPage = lazy(() => import("@/pages/SplitBillPage"));
const ScanQR = lazy(() => import("@/pages/ScanQR"));

// Компонент загрузки
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/split" element={<SplitBillPage />} />
        <Route path="/scan" element={<ScanQR />} />
      </Routes>
    </Suspense>
  );
}

export default App;
