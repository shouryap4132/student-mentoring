import { motion, type Variants } from "framer-motion";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8, 
      ease: "easeOut" as const 
    }
  }
};

function About() {
  return (
    <main className="bg-stone-50 min-h-screen pb-32 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center px-6"
      >
        <h1 className="text-6xl font-playfair font-bold mt-20 italic">
          Our Mission
        </h1>
        <p className="max-w-2xl mx-auto mt-8 text-xl text-stone-600 font-satoshi leading-relaxed">
          At Student Mentoring, we connect students with top-rated tutors who have excelled 
          where you are now. We believe the best teachers are those who just conquered the path.
        </p>
      </motion.div>

      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 px-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
      >
        <div>
          <h2 className="text-4xl font-playfair mb-6">Our Story</h2>
          <p className="text-stone-600 leading-relaxed text-lg font-satoshi">
            Founded in 2026, Student Mentoring was born out of the desire to create a supportive community. 
            We understand the challenges of modern academia because we live them every day.
          </p>
        </div>
        <div className="aspect-[4/5] bg-stone-200 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center text-stone-400 italic border border-stone-200">
          [Image: Team Workspace]
        </div>
      </motion.section>

      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-32 px-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
      >
        <div className="order-2 md:order-1 aspect-square bg-stone-300 rounded-[3rem] flex items-center justify-center text-stone-500 italic border border-stone-200 shadow-sm">
          [Image: Peer Mentoring Session]
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-4xl font-playfair mb-6">Expertise, Refined</h2>
          <p className="text-stone-600 leading-relaxed text-lg font-satoshi">
            Our tutors aren't just smart—they're communicators. We vet for empathy and 
            patience as much as we do for GPA. From Calculus to History, we've got your back.
          </p>
        </div>
      </motion.section>

      <motion.section 
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mt-40 px-6 max-w-4xl mx-auto text-center bg-black text-white py-20 rounded-[4rem] shadow-2xl"
      >
        <h2 className="text-5xl font-playfair mb-6">Join the Community</h2>
        <p className="text-stone-400 text-xl mb-10 max-w-xl mx-auto">
          Ready to turn your struggle into a strength? Let's find your mentor.
        </p>
        <button className="bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-110 transition-transform font-satoshi">
          Find a Tutor
        </button>
      </motion.section>
    </main>
  );
}

export default About;