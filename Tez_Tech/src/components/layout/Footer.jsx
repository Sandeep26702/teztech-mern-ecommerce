import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const currentPath = location.pathname;

  // Sirf Home aur About par true hoga
  const showOnMobile = currentPath === "/" || currentPath === "/about";

  return (
    <footer className={`relative pt-10 pb-6 mt-auto overflow-hidden font-sans text-gray-300 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-black ${!showOnMobile ? "max-md:hidden" : ""}`}>
      
      {/* Background Glowing Orbs for Premium Vibe */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 px-4 w-full sm:px-8 lg:px-12">
        
        {/* Top Grid Section (4 Columns) */}
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* 1. Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              SONANI ELECTRONICS
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              LED Strips (RGB, RGBW, Digital) <br/>
              Pixel LED Controllers (DMX, Bluetooth, Wi-Fi) <br/>
              Flexible LED Screens & Badge Displays <br/>
              Programmable Polysheets & Chasers <br/>
              Smart Power Supplies and Accessories
            </p>

            {/* Social Icons (Instagram, X, FB, YouTube) */}
            <div className="flex gap-4 pt-2">
              {/* Instagram */}
              <div className="social-button">
                <a href="https://www.instagram.com/teztechsurat" target="_blank" rel="noopener noreferrer" className="relative block w-10 h-10 rounded-full group sm:w-12 sm:h-12 focus:outline-none">
                  <div className="absolute top-0 left-0 w-full h-full duration-300 rounded-full floater bg-violet-500 group-hover:-top-6 group-hover:shadow-2xl group-focus:-top-6 group-active:-top-6"></div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full transition-colors duration-300 border-2 rounded-full icon border-violet-500 bg-gray-800/80 group-hover:bg-transparent group-focus:bg-transparent group-active:bg-transparent">
                    <svg fill="none" viewBox="0 0 22 22" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.94 6.46809C21.8884 5.2991 21.6994 4.49551 21.4285 3.79911C21.1492 3.05994 20.7194 2.39818 20.1564 1.84802C19.6062 1.28932 18.9401 0.855163 18.2094 0.580194C17.5091 0.309437 16.7096 0.120336 15.5407 0.0688497C14.363 0.0128932 13.9891 0 11.0022 0C8.01527 0 7.64141 0.0128932 6.46808 0.064466C5.29914 0.116039 4.49551 0.305225 3.79932 0.57581C3.05994 0.855163 2.39818 1.28494 1.84802 1.84802C1.28932 2.39813 0.855377 3.06428 0.580193 3.7949C0.309437 4.49551 0.120379 5.2948 0.0688496 6.4637C0.0129362 7.64141 0 8.01527 0 11.0022C0 13.9891 0.0129362 14.363 0.0644659 15.5363C0.116039 16.7053 0.305225 17.5089 0.576025 18.2053C0.855377 18.9444 1.28932 19.6062 1.84802 20.1564C2.39818 20.7151 3.06432 21.1492 3.79494 21.4242C4.49547 21.6949 5.29476 21.884 6.46391 21.9355C7.63702 21.9873 8.0111 22 10.998 22C13.9849 22 14.3588 21.9873 15.5321 21.9355C16.7011 21.884 17.5047 21.695 18.2009 21.4242C18.9321 21.1415 19.5961 20.7091 20.1505 20.1548C20.7048 19.6005 21.1373 18.9365 21.42 18.2053C21.6906 17.5047 21.8798 16.7052 21.9314 15.5363C21.9829 14.363 21.9958 13.9891 21.9958 11.0022C21.9958 8.01527 21.9914 7.64137 21.94 6.46809ZM19.9588 15.4503C19.9114 16.5248 19.731 17.105 19.5805 17.4918C19.2109 18.4502 18.4502 19.2109 17.4918 19.5805C17.105 19.731 16.5206 19.9114 15.4503 19.9586C14.29 20.0103 13.942 20.023 11.0066 20.023C8.07118 20.023 7.71881 20.0103 6.56259 19.9586C5.48816 19.9114 4.90796 19.731 4.52117 19.5805C4.04425 19.4043 3.61014 19.1249 3.25772 18.7596C2.89242 18.4029 2.61306 17.9731 2.43677 17.4961C2.28635 17.1094 2.10589 16.5248 2.05874 15.4547C2.007 14.2943 1.99428 13.9461 1.99428 11.0107C1.99428 8.07535 2.007 7.72298 2.05874 6.56698C2.10589 5.49254 2.28635 4.91235 2.43677 4.52555C2.61306 4.04842 2.89241 3.61439 3.26211 3.26189C3.61865 2.89658 4.04842 2.61723 4.52555 2.44115C4.91235 2.29073 5.49692 2.11023 6.56697 2.06291C7.72736 2.01134 8.07556 1.99844 11.0107 1.99844C13.9505 1.99844 14.2985 2.01134 15.4547 2.06291C16.5292 2.11027 17.1093 2.29069 17.4961 2.44111C17.9731 2.61723 18.4072 2.89658 18.7596 3.26189C19.1249 3.61865 19.4042 4.04842 19.5805 4.52555C19.731 4.91235 19.9114 5.49671 19.9587 6.56698C20.0103 7.72736 20.0232 8.07535 20.0232 11.0107C20.0232 13.9461 20.0104 14.29 19.9588 15.4503Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path><path d="M11.0026 5.35054C7.88252 5.35054 5.35107 7.88182 5.35107 11.0021C5.35107 14.1223 7.88252 16.6536 11.0026 16.6536C14.1227 16.6536 16.6541 14.1223 16.6541 11.0021C16.6541 7.88182 14.1227 5.35054 11.0026 5.35054ZM11.0026 14.668C8.97844 14.668 7.33654 13.0264 7.33654 11.0021C7.33654 8.97774 8.97844 7.33609 11.0025 7.33609C13.0269 7.33609 14.6685 8.97774 14.6685 11.0021C14.6685 13.0264 13.0268 14.668 11.0026 14.668ZM18.1971 5.12706C18.1971 5.85569 17.6063 6.44646 16.8775 6.44646C16.1489 6.44646 15.5581 5.85569 15.5581 5.12706C15.5581 4.39833 16.1489 3.80774 16.8775 3.80774C17.6063 3.80774 18.1971 4.39829 18.1971 5.12706Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path></svg>
                  </div>
                </a>
              </div>
              {/* Twitter / X */}
              <div className="social-button">
                <a href="https://x.com/intent/post?url=https%3A%2F%2Fwww.teztech.in%2F&text=SONANI%20ELECTRONICS%3A" target="_blank" rel="noopener noreferrer" className="relative block w-10 h-10 rounded-full group sm:w-12 sm:h-12 focus:outline-none">
                  <div className="absolute top-0 left-0 w-full h-full duration-300 rounded-full bg-sky-500 floater group-hover:-top-6 group-hover:shadow-2xl group-focus:-top-6 group-active:-top-6"></div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full transition-colors duration-300 border-2 border-gray-700 rounded-full icon bg-gray-800/80 group-hover:bg-transparent group-hover:border-sky-500 group-focus:bg-transparent group-focus:border-sky-500 group-active:bg-transparent group-active:border-sky-500">
                    <svg fill="none" viewBox="0 0 22 22" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M12.8115 9.3155L20.8253 0H18.9263L11.9679 8.08852L6.41015 0H0L8.40433 12.2313L0 22H1.89914L9.24745 13.4583L15.1168 22H21.5269L12.811 9.3155H12.8115ZM10.2103 12.339L9.35878 11.1211L2.58343 1.42964H5.5004L10.9682 9.25094L11.8197 10.4689L18.9272 20.6354H16.0102L10.2103 12.3395V12.339Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path></svg>
                  </div>
                </a>
              </div>
              {/* Facebook */}
              <div className="social-button">
                <a href="https://www.facebook.com/sonanielectronics" target="_blank" rel="noopener noreferrer" className="relative block w-10 h-10 rounded-full group sm:w-12 sm:h-12 focus:outline-none">
                  <div className="absolute top-0 left-0 w-full h-full duration-300 bg-blue-500 rounded-full floater group-hover:-top-6 group-hover:shadow-2xl group-focus:-top-6 group-active:-top-6"></div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full transition-colors duration-300 border-2 border-blue-500 rounded-full icon bg-gray-800/80 group-hover:bg-transparent group-focus:bg-transparent group-active:bg-transparent">
                    <svg fill="none" viewBox="0 0 13 22" height="20" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M7.71289 22H4.1898C3.60134 22 3.12262 21.5213 3.12262 20.9328V12.9863H1.06717C0.478672 12.9863 0 12.5074 0 11.9191V8.514C0 7.9255 0.478672 7.44683 1.06717 7.44683H3.12262V5.74166C3.12262 4.05092 3.6535 2.6125 4.65773 1.58207C5.6665 0.546992 7.07627 0 8.7346 0L11.4214 0.00438281C12.0089 0.00537109 12.4868 0.484086 12.4868 1.07151V4.23311C12.4868 4.82157 12.0083 5.30028 11.4199 5.30028L9.61091 5.30093C9.05919 5.30093 8.91868 5.41153 8.88864 5.44543C8.83914 5.50172 8.78023 5.66062 8.78023 6.09954V7.4467H11.284C11.4725 7.4467 11.6551 7.49319 11.812 7.58076C12.1506 7.76995 12.3611 8.12762 12.3611 8.51417L12.3597 11.9193C12.3597 12.5074 11.881 12.9861 11.2926 12.9861H8.78019V20.9328C8.78023 21.5213 8.30139 22 7.71289 22ZM4.41233 20.7103H7.49031V12.4089C7.49031 12.016 7.81009 11.6964 8.20282 11.6964H11.07L11.0712 8.73662H8.20265C7.80991 8.73662 7.49031 8.41706 7.49031 8.02411V6.09959C7.49031 5.59573 7.54153 5.0227 7.92185 4.59198C8.38144 4.07133 9.10568 4.01126 9.61056 4.01126L11.1971 4.01057V1.29375L8.73357 1.28975C6.06848 1.28975 4.41238 2.99574 4.41238 5.7417V8.02407C4.41238 8.4168 4.09277 8.73658 3.7 8.73658H1.28975V11.6964H3.7C4.09277 11.6964 4.41238 12.016 4.41238 12.4089L4.41233 20.7103Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path></svg>
                  </div>
                </a>
              </div>
              {/* YouTube */}
              <div className="social-button">
                <a href="https://www.youtube.com/channel/UClnVtvv2SOz8z4-d4OGTgSw" target="_blank" rel="noopener noreferrer" className="relative block w-10 h-10 rounded-full group sm:w-12 sm:h-12 focus:outline-none">
                  <div className="absolute top-0 left-0 w-full h-full duration-300 bg-red-600 rounded-full floater group-hover:-top-6 group-hover:shadow-2xl group-focus:-top-6 group-active:-top-6"></div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full transition-colors duration-300 border-2 border-red-600 rounded-full icon bg-gray-800/80 group-hover:bg-transparent group-focus:bg-transparent group-active:bg-transparent">
                    <svg fill="none" viewBox="0 0 30 22" height="18" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M18.9945 9.70081L12.5775 6.18974C12.2085 5.98783 11.7724 5.99538 11.4108 6.20965C11.0489 6.42415 10.833 6.80311 10.833 7.22372V14.1857C10.833 14.6043 11.0476 14.9826 11.407 15.1973C11.5947 15.3094 11.8028 15.3657 12.0113 15.3657C12.2064 15.3654 12.3984 15.3166 12.57 15.2237L18.9872 11.7731C19.1742 11.6726 19.3305 11.5235 19.4397 11.3415C19.5489 11.1596 19.6069 10.9515 19.6077 10.7393C19.6086 10.527 19.552 10.3184 19.4441 10.1356C19.3362 9.95283 19.1808 9.80259 18.9945 9.70081ZM12.5352 13.3099V8.10662L17.3312 10.7308L12.5352 13.3099Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path><path d="M28.8325 5.19239L28.8312 5.17912C28.8065 4.94533 28.5617 2.86581 27.5508 1.80806C26.3822 0.56396 25.0574 0.412829 24.4203 0.340384C24.3722 0.335071 24.3241 0.329304 24.276 0.323081L24.2253 0.317805C20.3854 0.0385769 14.5862 0.000453846 14.5282 0.000226923L14.5231 0L14.518 0.000226923C14.4599 0.000453846 8.66074 0.0385769 4.7862 0.317805L4.73503 0.323081C4.69379 0.328641 4.64834 0.333747 4.59893 0.339533C3.96916 0.412149 2.65857 0.563563 1.48674 1.8526C0.523851 2.89905 0.245531 4.93404 0.216938 5.16272L0.213648 5.19239C0.204968 5.28969 0 7.60572 0 9.93077V12.1042C0 14.4293 0.204968 16.7453 0.213648 16.8428L0.21518 16.8574C0.239801 17.0875 0.484424 19.1289 1.49071 20.1871C2.58947 21.3895 3.97869 21.5486 4.72595 21.6341C4.84407 21.6476 4.94578 21.6592 5.01511 21.6714L5.08228 21.6807C7.29943 21.8916 14.2509 21.9955 14.5456 21.9998L14.5545 22L14.5634 21.9998C14.6214 21.9995 20.4204 21.9614 24.2604 21.6822L24.3111 21.6769C24.3597 21.6705 24.4142 21.6647 24.474 21.6585C25.1003 21.592 26.4037 21.454 27.5594 20.1823C28.5223 19.1358 28.8008 17.1007 28.8292 16.8723L28.8325 16.8426C28.8412 16.7451 29.0464 14.4293 29.0464 12.1042V9.93077C29.0461 7.60566 28.8412 5.28991 28.8325 5.19239ZM27.344 12.1042C27.344 14.2563 27.1561 16.4725 27.1383 16.6759C27.0661 17.2364 26.7724 18.5239 26.3033 19.0338C25.58 19.8296 24.837 19.9085 24.2945 19.9659C24.234 19.9721 24.1736 19.9789 24.1132 19.9863C20.3991 20.2549 14.8189 20.296 14.5619 20.2976C14.2736 20.2934 7.42372 20.1886 5.2742 19.989C5.16403 19.971 5.04501 19.9572 4.91963 19.9431C4.2834 19.8702 3.41247 19.7704 2.74282 19.0338L2.72705 19.017C2.26611 18.5368 1.98092 17.3328 1.90842 16.6826C1.89492 16.5288 1.70215 14.2864 1.70215 12.1042V9.93077C1.70215 7.78124 1.88964 5.56738 1.9078 5.35975C1.99403 4.69957 2.29317 3.49007 2.74282 3.00117C3.48826 2.18124 4.27432 2.09041 4.7942 2.03034C4.84384 2.02455 4.89013 2.01927 4.93291 2.01371C8.70107 1.74379 14.3214 1.70368 14.5231 1.70215C14.7247 1.70345 20.3431 1.74379 24.0778 2.01371C24.1236 2.0195 24.1737 2.02523 24.2275 2.03147C24.7623 2.0924 25.5705 2.18459 26.3122 2.9757L26.319 2.98301C26.78 3.46324 27.0652 4.68828 27.1376 5.35152C27.1505 5.4967 27.344 7.74397 27.344 9.93077V12.1042Z" className="duration-300 fill-gray-400 group-hover:fill-white group-focus:fill-white group-active:fill-white"></path></svg>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* 2. SPLIT COLUMN (Quick Links & Connect side-by-side) */}
          <div className="flex justify-between gap-4 md:col-span-1">
            
            {/* Quick Links */}
            <div className="w-1/2">
              <h4 className="relative inline-block mb-4 text-lg font-bold text-white">
                Quick Links
                <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
              </h4>
              <ul className="space-y-2">
                {['Home', 'About Us', 'Products', 'Get Quote'].map((item, index) => {
                  const routes = ['/', '/about', '/products', '/quotation'];
                  return (
                    <li key={item}>
                      <Link to={routes[index]} className="flex items-center text-sm text-gray-400 transition-colors outline-none hover:text-blue-400 focus:text-blue-400 active:text-blue-400">
                        {item}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Connect */}
            <div className="w-1/2">
              <h4 className="relative inline-block mb-4 text-lg font-bold text-white">
                Connect
                <span className="absolute left-0 w-1/2 h-1 rounded-full bg-cyan-400 -bottom-2"></span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://teztech.in" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium transition-all duration-300 outline-none text-slate-400 group hover:text-blue-400">
                    <span className="flex items-center justify-center w-8 h-8 mr-3 transition-colors duration-300 border rounded-xl border-slate-700 bg-slate-800/50 group-hover:bg-blue-500/20 group-hover:border-blue-400">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </span>
                    teztech.in
                  </a>
                </li>
                <li>
                  <a href="mailto:info@teztech.in" className="flex items-center text-sm font-medium transition-all duration-300 outline-none text-slate-400 group hover:text-rose-400">
                    <span className="flex items-center justify-center w-8 h-8 mr-3 transition-colors duration-300 border rounded-xl border-slate-700 bg-slate-800/50 group-hover:bg-rose-500/20 group-hover:border-rose-400">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </span>
                    Email Us
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/917801891805" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium transition-all duration-300 outline-none text-slate-400 group hover:text-green-400">
                    <span className="flex items-center justify-center w-8 h-8 mr-3 transition-colors duration-300 border rounded-xl border-slate-700 bg-slate-800/50 group-hover:bg-green-500/20 group-hover:border-green-400">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </span>
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="https://t.me/teztech" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium transition-all duration-300 outline-none text-slate-400 group hover:text-sky-400">
                    <span className="flex items-center justify-center w-8 h-8 mr-3 transition-colors duration-300 border rounded-xl border-slate-700 bg-slate-800/50 group-hover:bg-sky-500/20 group-hover:border-sky-400">
                      <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </span>
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Contact Info */}
          <div>
            <h4 className="relative inline-block mb-4 text-lg font-bold text-white">
              Contact Info
              <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span>Bhandariwad, Rander, Surat, Gujarat 395005</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                <span>+91 7801891805</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>info@teztech.in</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Mon-Sun: 9AM-7PM</span>
              </li>
            </ul>
          </div>

          {/* 4. Location Map */}
          <div>
            <h4 className="relative inline-block mb-4 text-lg font-bold text-white">
              Our Location
              <span className="absolute left-0 w-1/2 h-1 bg-blue-500 rounded-full -bottom-2"></span>
            </h4>
            <div className="relative h-40 overflow-hidden border shadow-lg border-slate-700 rounded-xl">
              <iframe
                title="Sonani Electronics Location"
                src="https://maps.google.com/maps?q=Bhandariwad,%20Rander,%20Surat,%20Gujarat%20395005&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-all duration-500 opacity-70"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 pt-6 text-sm text-gray-500 border-t border-gray-800 md:flex-row">
          <p>© {currentYear} Sonani Electronics. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="transition-colors hover:text-blue-400">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-blue-400">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer; 