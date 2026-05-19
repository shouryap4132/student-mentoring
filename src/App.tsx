import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import BodyContent from "./components/pages/Body";
import About from "./components/pages/About";
import Contact from "./components/pages/Contact";
import SignUp from "./components/pages/SignUp";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TutorDashboard from "./components/pages/TutorDashboard";
import Login from "./components/pages/Login";
import StudentDashboard from "./components/pages/StudentDashboard";
import LeadershipDashboard from "./components/pages/LeadershipDashboard";
import MasterDashboard from "./components/pages/MasterDashboard";


// Create a dummy page for now to test

function App() {
  const location = useLocation();
  const hideFooter = ["/tutordashboard", "/studentdashboard", "/leadership", "/master"].includes(location.pathname);

  return (
    <>
      <Navbar /> 
      
      <Routes>
        <Route path="/" element={<BodyContent />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tutordashboard" element={<TutorDashboard />} />
        <Route path="/studentdashboard" element={<StudentDashboard />} />
        <Route path="/leadership" element={<LeadershipDashboard />} />
        <Route path="/master" element={<MasterDashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      <Toaster position="top-right" />
      {!hideFooter && <Footer />}
    </>
  );
}

export default App;