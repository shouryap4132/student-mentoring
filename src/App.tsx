import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BodyContent from "./components/pages/Body";
import About from "./components/pages/About";
import Contact from "./components/pages/Contact";
import SignUp from "./components/pages/SignUp";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TutorDashboard from "./components/pages/TutorDashboard";
import Login from "./components/pages/Login";


// Create a dummy page for now to test

function App() {
  return (
    <Router>
      <Navbar /> 
      
      <Routes>
        <Route path="/home" element={<BodyContent />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tutordashboard" element={<TutorDashboard />} />
        <Route path="/login" element={<Login />} />



      </Routes>

      <Footer />
    </Router>

  );
}

export default App;