import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { supabase } from "../../utils/supabaseClient"; 
import { useNavigate } from "react-router-dom";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Signup() {
  const [role, setRole] = useState<"student" | "tutor" | null>(null);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subjectExpertise, setSubjectExpertise] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          grade_level: role === "student" ? gradeLevel : null,
          subjects: role === "tutor" ? subjectExpertise : null, 
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! You can now sign in.");
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

        {/* ROLE SELECTION */}
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
                  <Input 
                    label="Full Name" 
                    value={fullName}
                    onChange={(e: any) => setFullName(e.target.value)}
                    type="text" 
                    placeholder="Alex Rivera" 
                    required 
                  />
                  <Input 
                    label="Email" 
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    type="email" 
                    placeholder="alex@school.edu" 
                    required 
                  />
                </div>

                {role === "tutor" ? (
                  <Input 
                    label="Primary Subject Expertise" 
                    value={subjectExpertise}
                    onChange={(e: any) => setSubjectExpertise(e.target.value)}
                    type="text" 
                    placeholder="e.g. AP Calculus" 
                    required
                  />
                ) : (
                  <Input 
                    label="Current Grade Level" 
                    value={gradeLevel}
                    onChange={(e: any) => setGradeLevel(e.target.value)}
                    type="text" 
                    placeholder="e.g. 11th Grade" 
                    required
                  />
                )}

                <Input 
                  label="Password" 
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  type="password" 
                  placeholder="••••••••" 
                  required 
                />

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold font-satoshi mt-4 disabled:bg-stone-400"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}

// HELPER COMPONENTS
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

function Input({ label, ...props }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-satoshi font-bold text-[10px] uppercase tracking-widest text-stone-400">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi outline-none"
      />
    </div>
  );
}