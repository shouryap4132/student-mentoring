import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function SignUp() {
  const [role, setRole] = useState<"student" | "tutor" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subjectExpertise, setSubjectExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // All profile data is passed in options.data so the DB trigger creates
    // the complete profile row server-side (SECURITY DEFINER — bypasses RLS).
    // No separate profile upsert is needed from the frontend.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role ?? "student",
          grade_level: role === "student" ? gradeLevel : null,
          subjects: role === "tutor" ? subjectExpertise : null,
          bio,
          qualifications: role === "tutor" ? qualifications : null,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please sign in.");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-stone-50 pt-32 pb-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-playfair mb-4">Join the community.</h1>
          <p className="text-stone-500 font-satoshi">First, tell us who you are.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <RoleCard
            title="I want to learn"
            desc="Find a mentor to help you crush your next exam."
            selected={role === "student"}
            onClick={() => setRole("student")}
            icon="📖"
          />
          <RoleCard
            title="I want to tutor"
            desc="Share your knowledge and help others grow."
            selected={role === "tutor"}
            onClick={() => setRole("tutor")}
            icon="🎓"
          />
        </div>

        <AnimatePresence mode="wait">
          {role && (
            <motion.div
              key={role}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-200"
            >
              <h2 className="text-2xl font-playfair mb-8">
                {role === "student" ? "Student Details" : "Tutor Application"}
              </h2>

              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Full Name">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Rivera" required className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@school.edu" required className={inputCls} />
                  </Field>
                </div>

                {role === "tutor" ? (
                  <>
                    <Field label="Primary Subject Expertise">
                      <input type="text" value={subjectExpertise} onChange={(e) => setSubjectExpertise(e.target.value)}
                        placeholder="e.g. AP Calculus" required className={inputCls} />
                    </Field>
                    <Field label="Short Bio">
                      <input type="text" value={bio} onChange={(e) => setBio(e.target.value)}
                        placeholder="Share your teaching background" required className={inputCls} />
                    </Field>
                    <Field label="Qualifications">
                      <input type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)}
                        placeholder="e.g. Certified Tutor, STEM Mentor" required className={inputCls} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Current Grade Level">
                      <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                        placeholder="e.g. 11th Grade" required className={inputCls} />
                    </Field>
                    <Field label="Short Bio">
                      <input type="text" value={bio} onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us what you are studying" required className={inputCls} />
                    </Field>
                  </>
                )}

                <Field label="Password">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required className={inputCls} />
                </Field>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  disabled={loading} type="submit"
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold font-satoshi mt-4 disabled:bg-stone-400"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>

                <p className="text-center text-sm text-stone-400 font-satoshi pt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-black font-bold hover:underline">Sign in</Link>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}

const inputCls =
  "w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-satoshi font-bold text-[10px] uppercase tracking-widest text-stone-400">{label}</label>
      {children}
    </div>
  );
}

function RoleCard({ title, desc, selected, onClick, icon }: any) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -5 }}
      className={`cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${
        selected ? "border-black bg-white shadow-lg" : "border-transparent bg-stone-200/50 hover:bg-stone-200"
      }`}
    >
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-2xl font-playfair mb-2">{title}</h3>
      <p className="text-stone-500 text-sm font-satoshi leading-relaxed">{desc}</p>
    </motion.div>
  );
}
