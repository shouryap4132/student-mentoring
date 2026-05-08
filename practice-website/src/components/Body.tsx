function BodyContent() {
  return (
    <main className="min-h-[200vh] bg-stone-50 font-satoshi">
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-4 bg-linear-to-b from-stone-200 to-stone-50">
        <h2 className="font-playfair text-6xl md:text-8xl mb-6 tracking-tight">
          Modern Mentoring
        </h2>
        <p className="max-w-xl text-lg md:text-xl text-stone-600 mb-8 font-medium">
          Elevate your learning experience with Satoshi Variable typography 
          and smooth Framer Motion interactions.
        </p>
        <div className="flex gap-4">
          <div className="w-12 h-1 bg-black rounded-full" />
        </div>
      </section>

      {/* Content Section to provide scroll depth */}
      <section className="max-w-4xl mx-auto py-24 px-6 space-y-24">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group">
            <span className="text-stone-400 font-bold text-sm uppercase tracking-widest">
              Feature 0{i}
            </span>
            <h3 className="font-playfair text-4xl mt-2 mb-4 group-hover:italic transition-all">
              Variable Design Systems
            </h3>
            <p className="text-stone-600 leading-relaxed text-lg">
              Since we are using a variable font, we can transition from 
              <span className="font-[300]"> light (300) </span> to 
              <span className="font-[900]"> black (900) </span> 
              without loading extra files. This keeps your mentoring platform 
              fast, accessible, and beautiful.
            </p>
            <div className="mt-8 w-full h-64 bg-stone-200 rounded-3xl overflow-hidden">
               <div className="w-full h-full bg-linear-to-br from-stone-300 to-stone-100 opacity-50" />
            </div>
          </div>
        ))}
      </section>

      {/* Footer-ish area */}
      <section className="h-[50vh] flex items-center justify-center bg-black text-white">
        <p className="font-playfair text-3xl">Keep Scrolling.</p>
      </section>
    </main>
  );
}

export default BodyContent;