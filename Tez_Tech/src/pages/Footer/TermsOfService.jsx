import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaPhoneAlt, FaFileContract } from 'react-icons/fa';

const TermsOfService = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Sidebar navigation links
  const sections = [
    { id: "intro", title: "1. Introduction" },
    { id: "orders", title: "2. Orders and Payment" },
    { id: "shipping", title: "3. Shipping and Delivery" },
    { id: "returns", title: "4. Returns and Refunds" },
    { id: "liability", title: "5. Limitation of Liability" },
    { id: "intellectual-property", title: "6. Intellectual Property" },
    { id: "governing-law", title: "7. Governing Law" },
    { id: "changes", title: "8. Changes to Terms" },
    { id: "contact", title: "9. Contact Information" },
  ];

  return (
    <div className="min-h-screen font-sans bg-gray-50 selection:bg-blue-200 selection:text-blue-900">
      
      {/* 🌟 Premium Hero Header */}
      <div className="relative px-4 pt-16 pb-24 overflow-hidden text-white bg-gray-900 sm:px-6 lg:px-8">
        {/* Magic Blur Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -top-24 -right-24"></div>
           <div className="absolute w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 top-12 -left-24"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center mx-auto text-center max-w-7xl">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold tracking-wider text-gray-400 uppercase transition-colors hover:text-white">
            <FaArrowLeft /> Back to Home
          </Link>
          <div className="flex items-center justify-center w-16 h-16 mb-6 border bg-white/10 backdrop-blur-md rounded-2xl border-white/20">
            <FaFileContract className="text-3xl text-blue-400" />
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Terms & Conditions</h1>
          <p className="font-medium text-gray-400">Please read these terms carefully before using our service.</p>
        </div>
      </div>

      {/* 🌟 Main Content Layout */}
      <div className="relative z-20 px-4 pb-20 mx-auto -mt-12 max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          
          {/* ================= SIDEBAR NAVIGATION (Desktop Only) ================= */}
          <aside className="sticky hidden w-1/4 p-6 bg-white border border-gray-200 shadow-sm lg:block top-24 rounded-2xl">
            <h3 className="mb-4 text-xs font-black tracking-widest text-gray-400 uppercase">Contents</h3>
            <nav className="flex flex-col space-y-1">
              {sections.map((s) => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`}
                  className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                >
                  {s.title}
                </a>
              ))}
            </nav>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 mt-8 text-sm font-bold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <FaPrint /> Print Terms
            </button>
          </aside>

          {/* ================= POLICY TEXT CONTENT ================= */}
          <main className="w-full p-6 leading-relaxed text-gray-700 bg-white border border-gray-200 shadow-sm lg:w-3/4 rounded-2xl md:p-10 lg:p-12">
            
            {/* Mobile Print Button */}
            <div className="flex justify-end mb-6 lg:hidden">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 rounded-lg bg-blue-50">
                <FaPrint /> Print
              </button>
            </div>

            {/* Section 1: Introduction */}
            <section id="intro" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-black text-gray-900">1. Introduction</h2>
              <p className="text-lg font-medium text-gray-600">
                These terms and conditions govern the sale of electronic products and services ("Products") by <strong>SONANI ELECTRONICS</strong> to customers using the Company's website or other platforms. By accessing or purchasing from this site, you agree to abide by these terms and conditions.
              </p>
            </section>

            {/* Section 2: Orders and Payment */}
            <section id="orders" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">2. Orders and Payment</h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-xl">
                  <span className="mr-2 font-bold text-blue-700">2.1.</span>
                  Placement of an order constitutes an offer to purchase the Products. All orders are subject to acceptance by the Company.
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-xl">
                  <span className="mr-2 font-bold text-blue-700">2.2.</span>
                  Prices for Products are as listed on the website. The Company reserves the right to change prices without prior notice.
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-xl">
                  <span className="mr-2 font-bold text-blue-700">2.3.</span>
                  Payment for orders must be made in full or as per discussed terms at the time of purchase. We accept payments through various secure methods as specified on our website.
                </div>
              </div>
            </section>

            {/* Section 3: Shipping and Delivery */}
            <section id="shipping" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">3. Shipping and Delivery</h2>
              <div className="space-y-4">
                <p className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-[2.5rem]">3.1.</span>
                  <span>The Company will make reasonable efforts to deliver Products within the estimated timeframe. However, delivery times may vary based on location and circumstances beyond our control.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-[2.5rem]">3.2.</span>
                  <span>Risk of loss and title for Products pass to the customer upon delivery to the carrier.</span>
                </p>
              </div>
            </section>

            {/* Section 4: Returns and Refunds */}
            <section id="returns" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">4. Returns and Refunds</h2>
              <div className="space-y-4">
                <div className="p-5 border border-gray-200 rounded-xl">
                  <p className="mb-2">
                    <span className="px-2 py-1 mr-2 text-xs font-bold text-orange-700 bg-orange-100 rounded-md">4.1</span>
                    Customers may return Products within <strong>6 to 7 days</strong> of receipt, subject to the Company's Return Policy available on the website.
                  </p>
                  <p>
                    <span className="px-2 py-1 mr-2 text-xs font-bold text-orange-700 bg-orange-100 rounded-md">4.2</span>
                    Refunds will be issued in accordance with the Return Policy and upon receipt and inspection of returned Products.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Limitation of Liability */}
            <section id="liability" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">5. Limitation of Liability</h2>
              <ul className="pl-5 space-y-3 list-none">
                <li className={`relative before:content-[''] before:absolute before:-left-5 before:top-2.5 before:w-2 before:h-2 before:bg-gray-400 before:rounded-full`}>
                  <strong>5.1.</strong> The Company shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Products.
                </li>
                <li className={`relative before:content-[''] before:absolute before:-left-5 before:top-2.5 before:w-2 before:h-2 before:bg-gray-400 before:rounded-full`}>
                  <strong>5.2.</strong> The total liability of the Company, whether in contract, warranty, tort (including negligence), or otherwise, shall not exceed the purchase price of the Product.
                </li>
              </ul>
            </section>

            {/* Section 6: Intellectual Property */}
            <section id="intellectual-property" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">6. Intellectual Property</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>6.1.</strong> All intellectual property rights related to the Products remain the property of the Company.</p>
                <p><strong>6.2.</strong> Customers shall not reproduce, distribute, or use any copyrighted material without prior written consent from the Company.</p>
              </div>
            </section>

            {/* Section 7: Governing Law */}
            <section id="governing-law" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-black text-gray-900">7. Governing Law</h2>
              <p className="p-4 text-gray-800 bg-gray-100 border-l-4 border-gray-400 rounded-r-lg">
                <strong>7.1.</strong> These terms and conditions shall be governed by and construed in accordance with the laws of <strong>India</strong>, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Section 8: Changes to Terms */}
            <section id="changes" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-black text-gray-900">8. Changes to Terms and Conditions</h2>
              <p>
                <strong>8.1.</strong> The Company reserves the right to modify these terms and conditions at any time without prior notice. Customers are encouraged to review the terms regularly for any updates.
              </p>
            </section>

            {/* Section 9: Contact Information */}
            <section id="contact" className="pt-8 border-t border-gray-200 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">9. Contact Information</h2>
              <p className="mb-6 text-gray-600">
                <strong>9.1.</strong> For inquiries or concerns regarding these terms and conditions, please contact us securely using the details below:
              </p>
              
              {/* Premium Contact Card */}
              <div className="relative flex flex-col justify-between gap-6 p-6 overflow-hidden text-white bg-gray-900 shadow-xl rounded-2xl sm:p-8 sm:flex-row sm:items-center">
                <div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 bg-white rounded-full opacity-5 blur-2xl"></div>
                <div className="relative z-10">
                  <h3 className="mb-2 text-xl font-bold">SONANI ELECTRONICS</h3>
                  <p className="mb-4 text-sm text-gray-400">Customer Support & Inquiries</p>
                  <a href="tel:+917801891805" className="inline-flex items-center gap-3 px-4 py-2 font-medium text-blue-400 transition-colors border hover:text-blue-300 bg-blue-900/30 rounded-xl border-blue-800/50">
                    <FaPhoneAlt /> +91 78018 91805
                  </a>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* 🖨️ Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          aside, button, nav, .bg-gray-900 { display: none !important; }
          main { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          h1, h2, h3, p, li, div { color: black !important; }
          .bg-gray-50, .bg-orange-100 { background: transparent !important; }
          .border-blue-500 { border-color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default TermsOfService;