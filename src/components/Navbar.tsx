import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

function Navbar() {
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const navbarContent = ["Home", "About", "Contact"];

  // 1. Listen for Auth Changes & Fetch Role
  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setUserRole(data?.role || "student");
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // 2. Framer Motion Transforms (Your original styles)
  const width = useTransform(scrollY, [0, 50], ["100%", "90%"]);
  const borderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
  const marginTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);
  const bgPos = useTransform(scrollY, [0, 200], ["0% 50%", "100% 50%"]);

  // 3. Dynamic Logic for Navbar State
  const isHomePage = location.pathname === "/";
  const dashboardPath = userRole === "tutor" ? "/tutordashboard" : "/studentdashboard";

  return (
    <motion.nav
      style={{ width, borderRadius, marginTop }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 grid grid-cols-3 items-center p-4 bg-stone-200/90 backdrop-blur-md text-black border border-stone-300/20 shadow-lg"
    >
      <Link to="/" className="text-2xl font-playfair tracking-wider font-bold">
        SM<span className="italic text-stone-500">.</span>
      </Link>

      <ul className="flex justify-center gap-8 font-satoshi font-bold uppercase text-[10px] tracking-widest">
        {navbarContent.map((item) => (
          <li key={item}>
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="hover:text-stone-500 transition">
              {item}
            </Link>
          </li>
        ))}
        {/* ADDED: Dashboard link appears only when logged in */}
        {user && (
          <li>
            <Link to={dashboardPath} className="text-black hover:text-stone-500 transition">
              Dashboard
            </Link>
          </li>
        )}
      </ul>

      <div className="flex justify-end gap-4 items-center">
        {user ? (
          // LOGGED IN: Sign Out Button
          <motion.button
            onClick={handleSignOut}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 font-satoshi font-bold text-xs uppercase tracking-widest text-black rounded-xl border border-stone-400 hover:bg-stone-300 transition-colors"
          >
            Sign Out
          </motion.button>
        ) : (
          // LOGGED OUT: Start Now (Home) vs Sign In (Everywhere else)
          <Link to={isHomePage ? "/signup" : "/login"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ backgroundPosition: bgPos }}
              className="
                  px-6 py-2 font-satoshi font-bold text-xs uppercase tracking-widest text-black rounded-xl
                  bg-linear-to-r from-stone-300 via-stone-100 to-stone-300
                  bg-[length:200%_100%] transition-shadow hover:shadow-md border border-stone-300
              "
            >
              {isHomePage ? "Start Now" : "Sign In"}
            </motion.button>
          </Link>
        )}
      </div>
    </motion.nav>
  );
}

export default Navbar;