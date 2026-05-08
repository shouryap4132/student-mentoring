import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation, Link } from "react-router-dom"; // Use Link for internal routing
import { supabase } from "../utils/supabaseClient";

function Navbar() {
  const { scrollY } = useScroll();
  const location = useLocation(); // 1. Hook to detect what page we are on
  const [user, setUser] = useState<any>(null); // 2. State to track if logged in
  
  const navbarContent = ["Home", "About", "Contact"];

  // 3. Listen for Auth Changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for sign-in/sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Framer Motion Transforms (kept from your original)
  const width = useTransform(scrollY, [0, 50], ["100%", "90%"]);
  const borderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
  const marginTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);
  const shadowOpacity = useTransform(scrollY, [0, 100], [0, 0.15]);
  const bgPos = useTransform(scrollY, [0, 200], ["0% 50%", "100% 50%"]);
  const shadow = useTransform(shadowOpacity, (opacity) => `0 10px 15px -3px rgba(0, 0, 0, ${opacity})`);

  // 4. Logic for the Dynamic Button
  const getButtonContent = () => {
    if (user) {
      return { text: "Dashboard", link: "/dashboard" };
    }
    if (location.pathname === "/signup") {
      return { text: "Sign In", link: "/login" };
    }
    return { text: "Start Now", link: "/signup" };
  };

  const buttonData = getButtonContent();

  return (
    <motion.nav
      style={{ width, borderRadius, marginTop, boxShadow: shadow }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 grid grid-cols-3 items-center p-4 bg-stone-200/90 backdrop-blur-md text-black"
    >
      <Link to="/" className="text-2xl font-playfair tracking-wider">
        Student Mentoring
      </Link>

      <ul className="flex justify-center gap-6 font-satoshi font-medium">
        {navbarContent.map((item) => (
          <li key={item}>
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="hover:text-stone-600 transition">
              {item}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Link to={buttonData.link}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ backgroundPosition: bgPos }}
            className="
                px-6 py-2 font-satoshi font-bold text-black rounded-xl
                bg-linear-to-r from-stone-300 via-stone-200 to-stone-300
                bg-[length:200%_100%] transition-shadow hover:shadow-md
            "
          >
            {buttonData.text}
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
}

export default Navbar;