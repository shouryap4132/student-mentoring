import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import LeadershipDashboard from "./pages/LeadershipDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  const location = useLocation();
  const hideFooter = ["/tutordashboard", "/studentdashboard", "/leadership", "/masterdashboard"].includes(location.pathname);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/studentdashboard" element={<StudentDashboard />} />
        <Route path="/tutordashboard" element={<TutorDashboard />} />
        <Route path="/leadership" element={<LeadershipDashboard />} />
        <Route path="/masterdashboard" element={<MasterDashboard />} />
      </Routes>

      <Toaster position="top-right" />
      {!hideFooter && <Footer />}
    </>
  );
}

export default App;
