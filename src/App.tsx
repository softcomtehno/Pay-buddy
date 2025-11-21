import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Features from "@/pages/Features";
import SplitBillPage from "@/pages/SplitBillPage";
import ScanQR from "@/pages/ScanQR";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/split" element={<SplitBillPage />} />
      <Route path="/scan" element={<ScanQR />} />
    </Routes>
  );
}

export default App;
