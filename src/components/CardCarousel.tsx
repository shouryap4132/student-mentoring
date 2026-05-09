import { motion, MotionValue, useTransform } from "framer-motion";

interface Tutor {
  name: string;
  sub: string;
  img: string;
}

interface Props {
  scrollProgress: MotionValue<number>;
}

export const CardCarousel = ({ scrollProgress }: Props) => {
  // Adjusted horizontal travel
  const x = useTransform(scrollProgress, [0, 1], ["0%", "-65%"]);
  
  const tutors: Tutor[] = [
    { name: "Shourya Patel", sub: "Calculus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
    { name: "Emily Chen", sub: "Physics", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400" },
    { name: "Michael Lee", sub: "Chemistry", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" },
    { name: "Sophia Kim", sub: "Biology", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
    { name: "David Nguyen", sub: "CS", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400" },
    { name: "Olivia Garcia", sub: "English", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
    { name: "James Wilson", sub: "History", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" },
    { name: "Ava Martinez", sub: "Economics", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" },
    { name: "Ethan Davis", sub: "Psychology", img: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=400" },
  ];

  return (
    <div className="sticky top-0 h-screen flex items-center overflow-hidden bg-stone-50">
      <motion.div 
        style={{ x }} 
        className="flex gap-12 px-[10vw]"
      >
        {tutors.map((tutor, i) => (
          <TutorCard key={i} tutor={tutor} index={i} scrollProgress={scrollProgress} />
        ))}
        {/* Spacer for final card visibility */}
        <div className="min-w-[30vw] flex-shrink-0" />
      </motion.div>
    </div>
  );
};

// Internal Card Component - Moved outside to prevent re-renders
const TutorCard = ({ tutor, index, scrollProgress }: { tutor: Tutor, index: number, scrollProgress: MotionValue<number> }) => {
  // Dynamic Range for individual card scaling
  const start = index * 0.1;
  const end = start + 0.2;
  
  const scale = useTransform(scrollProgress, [start, end], [0.9, 1]);
  const rotate = useTransform(scrollProgress, [start, end], [-3, 0]);
  const opacity = useTransform(scrollProgress, [start, end], [0.5, 1]);

  return (
    <motion.div
      style={{ scale, rotate, opacity }}
      className="min-w-[450px] h-[550px] bg-white rounded-[3.5rem] border border-stone-200 p-10 flex flex-col justify-between shadow-xl shadow-stone-200/40 relative overflow-hidden group flex-shrink-0"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <span className="font-sans text-stone-300 font-black text-2xl tracking-tighter">
            {index + 1 < 10 ? `0${index + 1}` : index + 1}
          </span>
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-stone-100 shadow-inner transform -rotate-3 group-hover:rotate-0 transition-all duration-500">
            <img 
              src={tutor.img} 
              alt={tutor.name} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-serif text-5xl leading-tight text-stone-900 tracking-tight">{tutor.name}</h3>
          <div className="flex items-center gap-3 mt-5">
            <span className="w-8 h-[1.5px] bg-stone-300"></span>
            <p className="font-sans text-stone-500 uppercase tracking-[0.25em] text-[10px] font-black">
              {tutor.sub} Expert
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-stone-100 rounded-full text-[9px] font-black text-stone-400 uppercase tracking-widest">Top Tier</span>
            <span className="px-3 py-1.5 bg-stone-100 rounded-full text-[9px] font-black text-stone-400 uppercase tracking-widest">Verified</span>
        </div>
        <button className="w-full py-5 bg-black text-white rounded-[2rem] font-sans font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-300/50">
          Book a Session
        </button>
      </div>
    </motion.div>
  );
};

export default CardCarousel;