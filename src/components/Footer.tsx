import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-950 text-stone-400 py-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-2">
            <Link to="/" className="text-white text-2xl font-playfair italic mb-6 block">
              Student Mentoring.
            </Link>
            <p className="max-w-sm text-stone-500 font-satoshi leading-relaxed">
              Empowering the next generation through peer-to-peer academic excellence. 
              Built by students, for students.
            </p>
          </div>

          {/* NAV LINKS */}
          <div>
            <h4 className="text-white font-satoshi font-bold text-xs uppercase tracking-widest mb-6">
              Platform
            </h4>
            <ul className="space-y-4 font-satoshi text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Find a Tutor</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Join as a Tutor</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* SOCIAL/LEGAL */}
          <div>
            <h4 className="text-white font-satoshi font-bold text-xs uppercase tracking-widest mb-6">
              Connect
            </h4>
            <ul className="space-y-4 font-satoshi text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-satoshi text-xs text-stone-600">
            © {currentYear} Student Mentoring LLC. All rights reserved.
          </p>
          
          <motion.button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ y: -3 }}
            className="text-white font-satoshi text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            Back to top ↑
          </motion.button>
        </div>
      </div>
    </footer>
  );
}

