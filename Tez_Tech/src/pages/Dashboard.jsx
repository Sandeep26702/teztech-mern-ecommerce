import React from "react";

const Dashboard = () => {
  // Industry standard: Data ko array mein rakhna taaki code clean rahe aur future mein API se map karna aasan ho
  const cards = [
    {
      id: 1,
      title: "Analytics",
      description: "View your statistics and reports",
      icon: "📊",
      gradient: "from-blue-500 to-cyan-400",
      lightBg: "bg-blue-50",
    },
    {
      id: 2,
      title: "Orders",
      description: "Manage your orders and tracking",
      icon: "📦",
      gradient: "from-emerald-500 to-teal-400",
      lightBg: "bg-emerald-50",
    },
    {
      id: 3,
      title: "Settings",
      description: "Configure your preferences",
      icon: "⚙️",
      gradient: "from-purple-500 to-indigo-400",
      lightBg: "bg-purple-50",
    },
    {
      id: 4,
      title: "Reports",
      description: "Generate detailed reports",
      icon: "📈",
      gradient: "from-orange-500 to-yellow-400",
      lightBg: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen px-4 py-10 font-sans bg-gray-50 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Dashboard Grid - Responsive: 1 column mobile, 2 tablet, 4 desktop */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm cursor-pointer group rounded-2xl hover:border-transparent hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Masala: Top border gradient line jo hover par show hogi */}
              <div 
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>

              {/* Icon Container with hover animation */}
              <div className={`w-14 h-14 rounded-xl ${card.lightBg} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>

              {/* Text Content */}
              <h3 className="mb-2 text-xl font-bold text-gray-800 transition-colors group-hover:text-gray-900">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {card.description}
              </p>

              {/* Subtle arrow pointer that appears on hover */}
              <div className="absolute text-gray-400 transition-all duration-300 translate-x-4 opacity-0 bottom-6 right-6 group-hover:opacity-100 group-hover:translate-x-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;