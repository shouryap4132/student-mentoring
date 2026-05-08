import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function Contact() {
  return (
    <motion.main 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-stone-50 pt-32 pb-20 px-6 md:px-10"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h1 
          variants={itemVariants}
          className="text-6xl md:text-8xl font-playfair mb-12 tracking-tighter"
        >
          Get in <span className="italic">touch.</span>
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-20">
          {/* LEFT SIDE: INFO */}
          <motion.div variants={itemVariants} className="space-y-12">
            <div>
              <h3 className="font-satoshi font-bold text-sm uppercase tracking-widest text-stone-400 mb-4">
                General Inquiries
              </h3>
              <p className="text-2xl font-satoshi text-stone-800">hello@studentmentoring.com</p>
            </div>

            <div>
              <h3 className="font-satoshi font-bold text-sm uppercase tracking-widest text-stone-400 mb-4">
                Become a Tutor
              </h3>
              <p className="text-2xl font-satoshi text-stone-800">join@studentmentoring.com</p>
            </div>

            <div className="pt-10 border-t border-stone-200">
              <p className="font-playfair text-xl italic text-stone-500 max-w-xs">
                "The best way to learn is to teach someone else."
              </p>
            </div>
          </motion.div>

          {/* RIGHT SIDE: FORM */}
          <motion.div variants={itemVariants}>
            <form 
              name="contact" 
              method="POST" 
              data-netlify="true" 
              className="space-y-8"
            >
              {/* Hidden input for Netlify forms */}
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-satoshi font-bold text-xs uppercase text-stone-500">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Alex Smith" 
                    className="bg-transparent border-b border-stone-300 py-3 focus:outline-none focus:border-black transition-colors font-satoshi"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-satoshi font-bold text-xs uppercase text-stone-500">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="alex@example.com" 
                    className="bg-transparent border-b border-stone-300 py-3 focus:outline-none focus:border-black transition-colors font-satoshi"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-satoshi font-bold text-xs uppercase text-stone-500">Subject</label>
                <select 
                  name="subject"
                  className="bg-transparent border-b border-stone-300 py-3 focus:outline-none focus:border-black transition-colors font-satoshi"
                >
                  <option>Finding a Tutor</option>
                  <option>Becoming a Tutor</option>
                  <option>Billing Support</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-satoshi font-bold text-xs uppercase text-stone-500">Message</label>
                <textarea 
                  name="message"
                  rows={4} 
                  placeholder="How can we help?" 
                  className="bg-transparent border-b border-stone-300 py-3 focus:outline-none focus:border-black transition-colors font-satoshi resize-none"
                  required
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-5 bg-black text-white rounded-2xl font-satoshi font-bold text-lg hover:shadow-xl transition-all"
              >
                Send Message
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}

export default Contact;