import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect once the auth context confirms a logged-in user.
  // This runs whether they just signed in OR already had a session —
  // so clicking "Dashboard" while logged in also works.
  useEffect(() => {
    if (authLoading || !user) return;

    supabase
      .from("profiles")
      .select("role, roles")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        const role = profile?.role;
        const rolesArr: string[] = profile?.roles ?? [];

        if (role === "master" || rolesArr.includes("master")) {
          navigate("/masterdashboard", { replace: true });
        } else if (role === "leadership" || rolesArr.includes("leadership")) {
          navigate("/leadership", { replace: true });
        } else if (role === "tutor" || rolesArr.includes("tutor")) {
          navigate("/tutordashboard", { replace: true });
        } else {
          navigate("/studentdashboard", { replace: true });
        }
      });
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // On success: do NOT navigate here.
    // The onAuthStateChange event updates AuthProvider's user,
    // which triggers the useEffect above to redirect correctly.
  };

  // Show a spinner while checking existing session
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-stone-50 flex items-center justify-center px-6"
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-playfair mb-3 font-medium">Welcome back.</h1>
          <p className="text-stone-500 font-satoshi font-medium">Sign in to your learning community.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-stone-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <Field label="Email Address">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@school.edu" required
                className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none" />
            </Field>
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              disabled={loading} type="submit"
              className="w-full py-4 bg-black text-white rounded-2xl font-bold font-satoshi mt-4 disabled:bg-stone-400 shadow-lg shadow-stone-200/50"
            >
              {loading ? "Verifying..." : "Sign In"}
            </motion.button>
          </form>

          <div className="mt-8 text-center border-t border-stone-100 pt-8">
            <p className="text-sm text-stone-400 font-satoshi font-medium">
              New here?{" "}
              <Link to="/signup" className="text-black font-bold hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-satoshi font-bold text-[10px] uppercase tracking-widest text-stone-400">{label}</label>
      {children}
    </div>
  );
}
