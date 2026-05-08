import { motion } from "framer-motion";

export default function ProgressTracking() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-playfair font-bold">Learning Progress</h2>
      <div className="bg-black text-white p-10 rounded-[3rem]">
        <p className="text-sm text-stone-400 mb-2 uppercase tracking-widest font-bold">Monthly Goal</p>
        <h4 className="text-2xl font-playfair mb-8">85% of SAT Prep Completed</h4>
        <div className="w-full bg-stone-800 h-4 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="bg-white h-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
            <p className="text-stone-400 text-[10px] font-bold uppercase mb-2">Skill Level</p>
            <p className="text-xl font-bold">Advanced</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
            <p className="text-stone-400 text-[10px] font-bold uppercase mb-2">Course Streak</p>
            <p className="text-xl font-bold">5 Days</p>
        </div>
      </div>
    </div>
  );
}