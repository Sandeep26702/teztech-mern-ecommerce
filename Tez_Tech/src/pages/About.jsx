import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen px-4 py-16 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* 🌟 Header Section */}
        <div className="mb-20 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            About Sonani Electronics
          </h1>
          <div className="h-1.5 w-24 bg-blue-500 rounded-full mx-auto"></div>
        </div>
        
        {/* 📖 Story & Mission Grid */}
        <div className="grid items-center grid-cols-1 gap-12 mb-20 lg:grid-cols-2 lg:gap-20">
          
          {/* Left: Our Story */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Our Story
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Founded in <strong className="text-gray-900">2010</strong>, Sonani Electronics has been at the forefront of providing high-quality electronic components and innovative solutions to businesses and individuals across the industry.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              With over a decade of experience, we've built strong relationships with leading manufacturers and developed unmatched expertise in cutting-edge technologies. Our journey is fueled by passion, precision, and a commitment to powering the future.
            </p>
          </div>

          {/* Right: Our Mission (Premium Card) */}
          <div className="relative group">
            {/* Background Blob for glow effect */}
            <div className="absolute transition duration-500 opacity-25 -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-3xl blur group-hover:opacity-40"></div>
            
            <div className="relative flex flex-col justify-center h-full p-10 bg-white border border-gray-100 shadow-xl sm:p-12 rounded-2xl">
              <div className="flex items-center justify-center mb-6 w-14 h-14 bg-blue-50 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">Our Mission</h3>
              <p className="text-lg leading-relaxed text-gray-600">
                To provide reliable, innovative electronic solutions that empower our customers to achieve their goals. We strive to maintain the highest standards of <span className="font-semibold text-blue-600">quality, integrity, and service</span> in every component we deliver.
              </p>
            </div>
          </div>

        </div>

        {/* 🏆 Achievements Section */}
        <div className="relative p-10 overflow-hidden text-white shadow-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-gray-900 rounded-3xl sm:p-16">
          {/* Decorative background circles */}
          <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-white rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 bg-blue-400 rounded-full w-80 h-80 opacity-10 blur-3xl"></div>

          <div className="relative z-10 mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Our Achievements</h2>
            <p className="mt-3 text-lg text-blue-200">The numbers that define our success</p>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-8 divide-y sm:grid-cols-3 sm:divide-y-0 sm:divide-x divide-white/20">
            
            {/* Stat 1 */}
            <div className="pt-8 text-center sm:pt-0">
              <h3 className="mb-2 text-4xl font-extrabold text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-cyan-300 to-white drop-shadow-sm">
                10,000+
              </h3>
              <p className="text-lg font-medium tracking-wider text-blue-200 uppercase">Happy Customers</p>
            </div>

            {/* Stat 2 */}
            <div className="pt-8 text-center sm:pt-0">
              <h3 className="mb-2 text-4xl font-extrabold text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-cyan-300 to-white drop-shadow-sm">
                50,000+
              </h3>
              <p className="text-lg font-medium tracking-wider text-blue-200 uppercase">Products Delivered</p>
            </div>

            {/* Stat 3 */}
            <div className="pt-8 text-center sm:pt-0">
              <h3 className="mb-2 text-4xl font-extrabold text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-cyan-300 to-white drop-shadow-sm">
                99.9%
              </h3>
              <p className="text-lg font-medium tracking-wider text-blue-200 uppercase">Satisfaction Rate</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default About;