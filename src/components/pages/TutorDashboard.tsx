import { motion } from "framer-motion";
import { useState } from "react";

export default function TutorDashboard() {
  const [isActive, setIsActive] = useState(true);

  return (
    // Added pt-24 to ensure it sits below your fixed/sticky navbar
    <div className="flex min-h-screen bg-stone-50 font-satoshi pt-24">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-stone-200 p-8 hidden md:flex flex-col">
        <div className="text-xl font-playfair italic mb-12 text-stone-800">SM.</div>
        
        <nav className="space-y-6 flex-1">
          <NavItem label="Dashboard" active />
          <NavItem label="My Mentees" />
          <NavItem label="Service Log" />
          <NavItem label="Resources" />
          <NavItem label="Settings" />
        </nav>

        <div className="pt-6 border-t border-stone-200">
          <button className="text-sm text-stone-400 hover:text-stone-800 transition-colors font-bold uppercase tracking-widest">
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-playfair"
            >
              Welcome, <span className="italic">Alex</span>
            </motion.h1>
            <p className="text-stone-500 mt-2 font-medium">Thank you for your service today. You have 3 mentees waiting.</p>
          </div>

          {/* STATUS TOGGLE */}
          <div className="flex items-center gap-4 bg-white p-2 px-5 rounded-full shadow-sm border border-stone-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {isActive ? "Available to Mentor" : "Away"}
            </span>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-green-600' : 'bg-stone-300'}`}
            >
              <motion.div 
                animate={{ x: isActive ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px]"
              />
            </button>
          </div>
        </header>

        {/* NPO STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Hours Contributed" value="42.5" badge="Community Hero" />
          <StatCard label="Mentees Helped" value="12" badge="Impact" />
          <StatCard label="Resources Shared" value="28" badge="Growth" />
        </section>

        {/* UPCOMING SESSIONS */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-playfair">Scheduled Mentoring</h3>
            <button className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-black">View Calendar</button>
          </div>
          <div className="space-y-2">
            <SessionRow name="Jordan Lee" subject="AP Calculus" time="4:00 PM" />
            <SessionRow name="Sarah Chen" subject="Physics Honors" time="5:30 PM" />
            <SessionRow name="Mike Ross" subject="SAT Math Prep" time="7:00 PM" />
          </div>
        </section>
      </main>
    </div>
  );
}

// COMPONENTS
function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={`cursor-pointer text-xs font-bold uppercase tracking-widest transition-all ${active ? 'text-black translate-x-2' : 'text-stone-400 hover:text-stone-600 hover:translate-x-1'}`}>
      {label}
    </div>
  );
}

function StatCard({ label, value, badge }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-4xl font-satoshi font-medium">{value}</h4>
        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full uppercase tracking-tighter">
          {badge}
        </span>
      </div>
    </motion.div>
  );
}

function SessionRow({ name, subject, time }: any) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 px-4 rounded-2xl transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-400 group-hover:bg-black group-hover:text-white transition-colors">
          {name[0]}
        </div>
        <div>
          <p className="font-bold text-sm text-stone-800">{name}</p>
          <p className="text-xs text-stone-400 font-medium">{subject}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-stone-800">{time}</p>
        <p className="text-[10px] uppercase text-stone-400 tracking-widest font-medium">Virtual Room</p>
      </div>
    </div>
  );
}