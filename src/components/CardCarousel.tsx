import { motion, MotionValue, useTransform } from "framer-motion";

interface Props {
  scrollProgress: MotionValue<number>;
}

export const CardCarousel = ({ scrollProgress }: Props) => {
  // 1. Increased to -72% for 9 cards. 
  // If the last card is still cut off, try -75%
  const x = useTransform(scrollProgress, [0, 1], ["0%", "-55%"]);

  const tutors = [
    { name: "Alex", sub: "Calculus", color: "bg-stone-100" },
    { name: "Sarah", sub: "Biology", color: "bg-stone-200" },
    { name: "James", sub: "Physics", color: "bg-stone-300" },
    { name: "Elena", sub: "History", color: "bg-stone-400" },
    { name: "John", sub: "History", color: "bg-stone-500" },
    { name: "Some1", sub: "History", color: "bg-stone-400" },
    { name: "Some1", sub: "History", color: "bg-stone-300" },
    { name: "Some1", sub: "History", color: "bg-stone-200" },
    { name: "Some1", sub: "History", color: "bg-stone-100" },
  ];

  return (
    <div className="sticky top-0 h-screen flex items-center overflow-hidden">
      <motion.div style={{ x }} className="flex gap-8 px-[10vw]">
        {tutors.map((tutor, i) => (
          <div
            key={i}
            className={`min-w-[400px] h-[500px] ${tutor.color} rounded-[3rem] border border-stone-200 p-10 flex flex-col justify-between shadow-sm`}
          >
            <div>
              <span className="font-satoshi text-stone-400 font-bold">0{i + 1}</span>
              <h3 className="font-playfair text-4xl mt-4">{tutor.name}</h3>
              <p className="font-satoshi text-stone-600 mt-2 uppercase tracking-widest text-xs">
                {tutor.sub} Expert
              </p>
            </div>
            <button className="w-full py-4 bg-black text-white rounded-2xl font-satoshi font-bold hover:scale-105 transition-transform">
              Book a Session
            </button>
          </div>
        ))}

        {/* 2. THE SPACER: This creates the padding on the right of the last card */}
        <div className="min-w-[10vw] h-full flex-shrink-0" />
      </motion.div>
    </div>
  );
};

export default CardCarousel;