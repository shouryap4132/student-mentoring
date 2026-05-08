import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

function Navbar() {
  const { scrollY } = useScroll();
  const navbarContent = ["Home", "About", "Contact"];

  // 1. Define the transformation ranges
  // At 0px scroll: width 100%, rounded 0px
  // At 50px scroll: width 90%, rounded 24px
  const width = useTransform(scrollY, [0, 50], ["100%", "90%"]);
  const borderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
  const marginTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);
  const shadow = useTransform(
    scrollY, 
    [0, 50], 
    ["none", "0 10px 15px -3px rgb(0 0 0 / 0.1)"]
  );

  return (
    <motion.nav
      style={{ 
        width, 
        borderRadius, 
        marginTop,
        boxShadow: shadow 
      }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 grid grid-cols-3 items-center p-4 bg-stone-200/90 backdrop-blur-md text-black"
    >
      <h1 className="text-2xl font-bold font-satoshi tracking-wider">
        Student Mentoring
      </h1>

      <ul className="flex justify-center gap-6 font-satoshi font-medium">
        {navbarContent.map((item) => (
          <li key={item}>
            <a href={`/${item.toLowerCase()}`} className="hover:text-stone-600 transition">
              {item}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <button className="px-4 py-2 font-satoshi font-bold text-black rounded-xl bg-linear-to-r from-stone-300 via-stone-200 to-stone-300 bg-[length:200%_100%] bg-[position:0%_50%] hover:bg-[position:100%_50%] transition-all duration-500">
          Start Now
        </button>
      </div>
    </motion.nav>
  );
}

export default Navbar;