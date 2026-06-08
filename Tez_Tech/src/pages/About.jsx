import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen font-sans bg-[#f8fafc] text-slate-600 selection:bg-blue-200 selection:text-blue-900">
      
      {/* 🌟 1. HERO SECTION (Ultra Clean & Minimal) */}
      <section className="relative px-4 pt-24 pb-20 w-full sm:px-8 lg:px-12 lg:pt-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border rounded-full border-slate-200 bg-white shadow-sm">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-800">Sonani Electronics</span>
          </div>
          
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Powering the Future of <br className="hidden md:block" />
            <span className="text-blue-600">Electronic Solutions.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg leading-relaxed sm:text-xl text-slate-500">
            Your trusted partner for high-performance LED technology and premium electronic components. Built for innovators, by experts.
          </p>
        </div>
      </section>

      {/* 📖 2. STORY & MISSION (Elegant Overlapping Layout) */}
      <section className="px-4 py-16 w-full sm:px-8 lg:px-12">
        <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-2">
          
          {/* Who We Are */}
          <div className="space-y-8 lg:pr-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Who We Are</h2>
              <div className="w-16 h-1 mt-4 bg-blue-600"></div>
            </div>
            <p className="text-lg leading-relaxed text-slate-600">
              Founded by a team of experienced professionals, we recognized the growing demand for dependable LED products in India. What started as a small operation has evolved into a leading source, driven by trust, absolute precision, and customer satisfaction.
            </p>
            <p className="text-lg leading-relaxed text-slate-600">
              Our journey is rooted in understanding real customer challenges—finding genuine products, acquiring technical support, and ensuring fast delivery. We've built our infrastructure to serve as your ultimate one-stop shop.
            </p>
          </div>

          {/* Our Mission (Sleek Professional Card) */}
          <div tabIndex="0" className="relative p-10 transition-all duration-500 bg-white border outline-none sm:p-14 border-slate-200/60 rounded-[2rem] shadow-sm hover:shadow-xl focus:shadow-xl hover:-translate-y-2 focus:-translate-y-2 group">
            <div className="flex items-center justify-center w-16 h-16 mb-8 transition-colors duration-300 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-focus:bg-blue-600">
              <svg className="w-8 h-8 text-blue-600 transition-colors duration-300 group-hover:text-white group-focus:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-slate-900">Our Mission</h3>
            <p className="text-lg leading-relaxed text-slate-600">
              To simplify access to industrial-grade LED components. We strive to deliver <strong className="font-semibold text-slate-900">uncompromising quality, transparent pricing, and rapid fulfillment</strong>—helping you execute projects with absolute confidence.
            </p>
          </div>

        </div>
      </section>

      {/* 🍱 3. WHAT WE OFFER (Professional Bento Grid with SVGs) */}
      <section className="px-4 py-24 w-full sm:px-8 lg:px-12">
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">What We Offer</h2>
          <p className="mt-4 text-lg text-slate-500">Engineered components for professional display systems and lighting.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1 */}
          <div tabIndex="0" className="p-8 transition-all duration-300 bg-white border outline-none border-slate-200 rounded-[2rem] hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 focus:border-blue-300 focus:shadow-lg focus:-translate-y-1 group">
            <div className="flex items-center justify-center w-14 h-14 mb-6 transition-transform duration-500 bg-slate-50 rounded-xl text-slate-700 group-hover:scale-110 group-focus:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
            </div>
            <h4 className="mb-3 text-xl font-bold text-slate-900">LED Boards</h4>
            <p className="leading-relaxed text-slate-500">Commercial-grade boards engineered for advertising, high-resolution display systems, and creative lighting matrices.</p>
          </div>

          {/* Card 2 */}
          <div tabIndex="0" className="p-8 transition-all duration-300 bg-white border outline-none border-slate-200 rounded-[2rem] hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 focus:border-blue-300 focus:shadow-lg focus:-translate-y-1 group">
            <div className="flex items-center justify-center w-14 h-14 mb-6 transition-transform duration-500 bg-slate-50 rounded-xl text-slate-700 group-hover:scale-110 group-focus:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <h4 className="mb-3 text-xl font-bold text-slate-900">LED Controllers</h4>
            <p className="leading-relaxed text-slate-500">Advanced micro-controllers for precise pixel mapping, synchronization, and rendering fluid animation effects.</p>
          </div>

          {/* Card 3 */}
          <div tabIndex="0" className="p-8 transition-all duration-300 bg-white border outline-none border-slate-200 rounded-[2rem] hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 focus:border-blue-300 focus:shadow-lg focus:-translate-y-1 group">
            <div className="flex items-center justify-center w-14 h-14 mb-6 transition-transform duration-500 bg-slate-50 rounded-xl text-slate-700 group-hover:scale-110 group-focus:scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h4 className="mb-3 text-xl font-bold text-slate-900">SMPS Units</h4>
            <p className="leading-relaxed text-slate-500">Industrial Switched Mode Power Supplies ensuring stable, safe, and highly efficient power delivery for continuous loads.</p>
          </div>

          {/* Large Featured Card */}
          <div tabIndex="0" className="relative p-8 overflow-hidden transition-all duration-300 bg-white border outline-none border-slate-200 rounded-[2rem] hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 focus:border-blue-400 focus:shadow-xl focus:-translate-y-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center gap-8 group">
            <div className="absolute top-0 right-0 transition-opacity duration-700 opacity-0 pointer-events-none w-72 h-72 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full group-hover:opacity-100 group-focus:opacity-100"></div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0 w-20 h-20 transition-transform duration-500 border border-slate-100 bg-slate-50 rounded-2xl group-hover:scale-105 group-focus:scale-105 text-blue-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            <div className="relative z-10">
              <h4 className="mb-3 text-2xl font-bold text-slate-900">LED Pixels & Accessories</h4>
              <p className="max-w-4xl text-lg leading-relaxed text-slate-500">Perfect for dynamic architectural installations and digital signage. We provide industrial-grade wiring, secure connectors, and all necessary mounting accessories. Every batch is rigorously tested for longevity and absolute reliability.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ✅ 4. WHY CHOOSE US (Clean Professional Badges) */}
      <section className="px-4 py-24 border-t border-slate-200/60 w-full sm:px-8 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why Choose Us?</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, 
              title: "Genuine Products", 
              desc: "Verified components ensuring maximum lifespan." 
            },
            { 
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />, 
              title: "Fast Logistics", 
              desc: "Secure dispatch and rapid delivery across India." 
            },
            { 
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />, 
              title: "Technical Support", 
              desc: "Dedicated assistance for seamless integration." 
            },
            { 
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, 
              title: "B2B Solutions", 
              desc: "Custom pricing and support for large projects." 
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 bg-white border border-slate-200 rounded-2xl group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 text-slate-700 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h4>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🤝 5. TRANSPARENCY & STATS (Pristine Light Section for Contrast with Footer) */}
      <section className="relative px-4 py-24 border-t border-slate-200 bg-white sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Side */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Transparency & Trust
              </h2>
              <p className="text-lg leading-relaxed text-slate-500">
                We believe in forging long-term partnerships with our clients. Your operational success and satisfaction form the core of our business model.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                {[
                  'Zero hidden charges', 
                  'Accurate specifications', 
                  'Prompt communication', 
                  'Reliable after-sales'
                ].map((item, i) => (
                  <li key={i} className="flex items-center font-medium text-slate-700">
                    <svg className="w-5 h-5 mr-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats Side (Clean Minimal Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div tabIndex="0" className="p-8 text-center transition-all duration-300 bg-slate-50 border border-slate-200 rounded-[2rem] hover:-translate-y-1 hover:shadow-md focus:-translate-y-1 focus:shadow-md cursor-default outline-none">
                <div className="mb-2 text-4xl font-extrabold text-slate-900">10K+</div>
                <div className="text-xs font-bold tracking-widest uppercase text-slate-500">Active Clients</div>
              </div>
              
              <div tabIndex="0" className="p-8 text-center transition-all duration-300 bg-slate-50 border border-slate-200 rounded-[2rem] hover:-translate-y-1 hover:shadow-md focus:-translate-y-1 focus:shadow-md cursor-default outline-none">
                <div className="mb-2 text-4xl font-extrabold text-slate-900">50K+</div>
                <div className="text-xs font-bold tracking-widest uppercase text-slate-500">Units Delivered</div>
              </div>
              
              <div tabIndex="0" className="p-8 text-center transition-all duration-300 bg-blue-600 border border-blue-600 rounded-[2rem] hover:-translate-y-1 hover:shadow-lg focus:-translate-y-1 focus:shadow-lg cursor-default sm:col-span-2 outline-none group">
                <div className="mb-2 text-5xl font-extrabold text-white">99.9%</div>
                <div className="text-xs font-bold tracking-widest text-blue-200 uppercase">Quality Assurance</div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;