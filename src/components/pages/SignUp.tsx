import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";


const containerVariants: Variants ={
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};


export default function Signup() {
  const [role, setRole] = useState<"student" | "tutor" | null>(null);

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
            desc="Share your knowledge and earn while helping others."
            selected={role === "tutor"}
            onClick={() => setRole("tutor")}
            icon="🎓"
          />
        </div>

        {/* DYNAMIC FORM APPEARS ONCE ROLE IS SELECTED */}
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
              
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input label="Full Name" type="text" placeholder="Alex Rivera" />
                  <Input label="Email" type="email" placeholder="alex@school.edu" />
                </div>

                {role === "tutor" ? (
                  <Input label="Subject Expertise" type="text" placeholder="AP Calculus, Physics..." />
                ) : (
                  <Input label="Grade Level" type="text" placeholder="11th Grade" />
                )}

                <Input label="Password" type="password" placeholder="••••••••" />

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold font-satoshi mt-4"
                >
                  Create Account
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
        className="w-full bg-stone-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all font-satoshi"
      />
    </div>
  );
}