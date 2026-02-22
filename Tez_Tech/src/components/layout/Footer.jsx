import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-16 pb-8 mt-auto font-sans text-gray-300 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-black">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 gap-12 mb-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              SONANI ELECTRONICS
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Your trusted partner for premium electronic components and innovative solutions since 2010. Empowering the tech of tomorrow.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="flex items-center justify-center w-10 h-10 text-gray-400 transition-all duration-300 bg-gray-800 rounded-full hover:bg-blue-600 hover:text-white hover:-translate-y-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 text-gray-400 transition-all duration-300 bg-gray-800 rounded-full hover:bg-blue-400 hover:text-white hover:-translate-y-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 text-gray-400 transition-all duration-300 bg-gray-800 rounded-full hover:bg-pink-600 hover:text-white hover:-translate-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="relative inline-block mb-6 text-lg font-bold text-white">
              Quick Links
              <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
            </h4>
            <ul className="space-y-3">
              {['Home', 'About Us', 'Products', 'Get Quote'].map((item, index) => {
                const routes = ['/', '/about', '/products', '/quotation'];
                return (
                  <li key={item}>
                    <Link to={routes[index]} className="flex items-center text-sm text-gray-400 transition-colors group hover:text-blue-400">
                      <span className="mr-2 text-blue-500 transition-all duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                        ➔
                      </span>
                      {item}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="relative inline-block mb-6 text-lg font-bold text-white">
              Contact Info
              <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span>123 Electronics Street, Tech City, Surat, Gujarat</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>info@sonanielectronics.com</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Mon-Fri: 9AM-6PM</span>
              </li>
            </ul>
          </div>

          {/* Location Map */}
          <div>
            <h4 className="relative inline-block mb-6 text-lg font-bold text-white">
              Our Location
              <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
            </h4>
            <div className="relative h-48 overflow-hidden bg-gray-800 border border-gray-700 shadow-lg rounded-xl group">
              <iframe
                title="Google Maps Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119066.41709460833!2d72.7398947!3d21.1593402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be04e59411d1563%3A0xfe4558290938b042!2sSurat%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-opacity duration-300 opacity-80 group-hover:opacity-100"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-gray-500 border-t border-gray-800 md:flex-row">
          <p>© {currentYear} Sonani Electronics. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-blue-400">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-blue-400">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;