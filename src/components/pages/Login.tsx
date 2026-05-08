import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign in the user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    // 2. If Auth is successful, find out who they are in our 'profiles' table
    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        // Fallback to general dashboard if profile fetch hits a snag
        navigate("/dashboard");
      } else if (profile.role === "tutor") {
        // 3. Smart Redirect based on role
        navigate("/tutordashboard");
      } else {
        navigate("/dashboard");
      }
    }
    
    setLoading(false);
  };

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-stone-50 flex items-center justify-center px-6"
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-playfair mb-3">Welcome back.</h1>
          <p className="text-stone-500 font-satoshi">Sign in to continue your impact.</p>
        </div>

        <motion.div 
          className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-stone-200"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL INPUT */}
            <div className="flex flex-col gap-2">
              <label className="font-satoshi font-bold text-[10px] uppercase tracking-widest text-stone-400">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@school.edu"
                className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none"
                required
              />
            </div>

            {/* PASSWORD INPUT */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-satoshi font-bold text-[10px] uppercase tracking-widest text-stone-400">
                  Password
                </label>
                <button 
                  type="button"
                  className="text-[10px] font-bold uppercase text-stone-300 hover:text-black transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none"
                required
              />
            </div>

            {/* SUBMIT BUTTON */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-black text-white rounded-2xl font-bold font-satoshi mt-4 disabled:bg-stone-400 shadow-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>

          {/* REDIRECT TO SIGNUP */}
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-400 font-satoshi">
              Don't have an account?{" "}
              <Link to="/signup" className="text-black font-bold hover:underline">
                Join now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}