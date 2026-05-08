import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

function Navbar() {
    const { scrollY } = useScroll();
    const navbarContent = ["Home", "About", "Contact"];


    const width = useTransform(scrollY, [0, 50], ["100%", "90%"]);
    const borderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
    const marginTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);

    const shadowOpacity = useTransform(scrollY, [0, 100], [0, 0.15]);
    const bgPos = useTransform(scrollY, [0, 200], ["0% 50%", "100% 50%"]);

    const shadow = useTransform(
    shadowOpacity,
    (opacity) => `0 10px 15px -3px rgba(0, 0, 0, ${opacity})`
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
      <h1 className="text-2xlfont-satoshi tracking-wider">
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
        <motion.button
            style={{ backgroundPosition: bgPos }}
            className="
                px-4 py-2 font-satoshi text-black rounded-xl
                bg-linear-to-r from-stone-300 via-stone-200 to-stone-300
                bg-[length:200%_100%]
            "
            >
          Start Now
        </motion.button>
      </div>
    </motion.nav>
  );
}

export default Navbar;