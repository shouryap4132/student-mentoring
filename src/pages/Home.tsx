import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import CardCarousel from "../components/CardCarousel";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      className="min-h-[200vh] bg-stone-50 font-satoshi"
    >
      <section className="h-screen flex flex-col items-center justify-center text-center px-4 bg-linear-to-b from-stone-200 to-stone-50">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="font-playfair text-6xl md:text-8xl mb-6 tracking-tight"
        >
          Modern Mentoring
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="max-w-xl text-lg md:text-xl text-stone-600 mb-8 font-medium"
        >
          By Students, For Students
        </motion.p>
        <div className="flex gap-4">
          <div className="w-12 h-1 bg-black rounded-full" />
        </div>
      </section>

      <section className="h-[80vh] flex flex-col justify-center px-10">
        <h1 className="font-playfair text-7xl max-w-4xl">
          Learn from someone who's <span className="italic">actually</span> been there.
        </h1>
        <p className="font-satoshi text-xl text-stone-500 mt-6">
          Scroll down to meet our top-rated student tutors.
        </p>
      </section>

      <section ref={containerRef} className="relative h-[300vh]">
        <CardCarousel scrollProgress={scrollYProgress} />
      </section>

      <section className="h-screen bg-white flex items-center justify-center">
        <h2 className="font-playfair text-5xl">Ready to start your journey?</h2>
      </section>
    </motion.main>
  );
}
