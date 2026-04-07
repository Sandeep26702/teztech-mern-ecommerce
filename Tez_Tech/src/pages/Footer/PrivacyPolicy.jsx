import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

const PrivacyPolicy = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: "intro", title: "Introduction" },
    { id: "definitions", title: "Interpretation & Definitions" },
    { id: "collecting-data", title: "Collecting & Using Data" },
    { id: "tracking-cookies", title: "Tracking & Cookies" },
    { id: "use-of-data", title: "Use of Your Personal Data" },
    { id: "retention-transfer", title: "Retention & Transfer" },
    { id: "disclosure-security", title: "Disclosure & Security" },
    { id: "children-links-changes", title: "Children, Links & Changes" },
    { id: "contact", title: "Contact Us" },
  ];

  return (
    <div className="min-h-screen font-sans bg-gray-50 selection:bg-blue-200 selection:text-blue-900">
      
      {/* 🌟 Premium Hero Header */}
      <div className="relative px-4 pt-16 pb-24 overflow-hidden text-white bg-gray-900 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute bg-blue-500 rounded-full -top-24 -right-24 w-96 h-96 mix-blend-multiply filter blur-3xl opacity-20"></div>
           <div className="absolute bg-purple-500 rounded-full top-12 -left-24 w-72 h-72 mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center mx-auto text-center max-w-7xl">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm font-semibold tracking-wider text-gray-400 uppercase transition-colors hover:text-white">
            <FaArrowLeft /> Back to Home
          </Link>
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="font-medium text-gray-400">Last updated: February 14, 2021</p>
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
              className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
            >
              <FaPrint /> Print Policy
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

            <section id="intro" className="mb-12 scroll-mt-24">
              <p className="mb-6 text-lg font-medium text-gray-600">
                This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
              </p>
              <p className="mb-4">
                We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the Privacy Policy Generator.
              </p>
            </section>

            <section id="definitions" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Interpretation and Definitions</h2>
              <h3 className="mb-3 text-lg font-bold text-gray-800">Interpretation</h3>
              <p className="mb-6">
                The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
              </p>
              
              <h3 className="mb-4 text-lg font-bold text-gray-800">Definitions</h3>
              <p className="mb-4">For the purposes of this Privacy Policy:</p>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { term: "Account", desc: "A unique account created for You to access our Service or parts of our Service." },
                  { term: "Company", desc: 'Referred to as "the Company", "We", "Us" or "Our", refers to SONANI ELECTRONICS, BASEMENT, SHOP F, SILVERSTONE ARCADE, NR D MART, KATARGAM.' },
                  { term: "Cookies", desc: "Small files placed on Your device by a website, containing details of Your browsing history on that website among its many uses." },
                  { term: "Country", desc: "Refers to: Gujarat, India." },
                  { term: "Device", desc: "Any device that can access the Service such as a computer, a cell phone or a digital tablet." },
                  { term: "Personal Data", desc: "Any information that relates to an identified or identifiable individual." },
                  { term: "Service", desc: "Refers to the Website." },
                  { term: "Service Provider", desc: "Any natural or legal person who processes data on behalf of the Company to facilitate the Service." },
                  { term: "Third-party Social Media", desc: "Any website or social network through which a User can log in or create an account to use the Service." },
                  { term: "Usage Data", desc: "Data collected automatically, generated by the use of the Service (e.g., duration of a page visit)." },
                  { term: "Website", desc: "Refers to TEZTECH, accessible from https://www.teztech.in/" },
                  { term: "You", desc: "The individual accessing or using the Service, or the company/legal entity on behalf of which such individual is accessing the Service." },
                ].map((item, i) => (
                  <div key={i} className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                    <span className="block mb-1 font-bold text-gray-900">{item.term}</span>
                    <span className="text-sm">{item.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="collecting-data" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Collecting and Using Your Personal Data</h2>
              <h3 className="mb-3 text-xl font-bold text-gray-800">Types of Data Collected</h3>
              
              <h4 className="mt-6 mb-2 text-lg font-bold text-gray-800">Personal Data</h4>
              <p className="mb-4">While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Information may include, but is not limited to:</p>
              <ul className="pl-6 mb-6 space-y-2 text-gray-700 list-disc marker:text-blue-500">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Usage Data</li>
              </ul>

              <h4 className="mt-6 mb-2 text-lg font-bold text-gray-800">Usage Data</h4>
              <p className="mb-4">Usage Data is collected automatically when using the Service.</p>
              <p className="mb-4">Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
              <p className="mb-4">When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.</p>
            </section>

            <section id="tracking-cookies" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Tracking Technologies and Cookies</h2>
              <p className="mb-4">We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts. The technologies We use may include:</p>
              
              <div className="mb-6 space-y-4">
                <div className="pl-4 border-l-4 border-blue-500">
                  <strong className="text-gray-900">Cookies or Browser Cookies:</strong> A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent.
                </div>
                <div className="pl-4 border-l-4 border-purple-500">
                  <strong className="text-gray-900">Flash Cookies:</strong> Certain features of our Service may use local stored objects (or Flash Cookies) to collect and store information about Your preferences.
                </div>
                <div className="pl-4 border-l-4 border-emerald-500">
                  <strong className="text-gray-900">Web Beacons:</strong> Certain sections of our Service and our emails may contain small electronic files known as web beacons (clear gifs, pixel tags) that permit the Company to count users or for other statistics.
                </div>
              </div>

              <p className="mb-4">Cookies can be "Persistent" or "Session" Cookies. We use both Session and Persistent Cookies for the purposes set out below:</p>
              
              <ul className="mt-6 space-y-6">
                <li className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <strong className="block mb-1 text-lg text-gray-900">Necessary / Essential Cookies</strong>
                  <span className="block mb-2 text-sm font-medium text-blue-600">Type: Session Cookies | Administered by: Us</span>
                  <p className="text-sm">These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts.</p>
                </li>
                <li className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <strong className="block mb-1 text-lg text-gray-900">Cookies Policy / Notice Acceptance Cookies</strong>
                  <span className="block mb-2 text-sm font-medium text-blue-600">Type: Persistent Cookies | Administered by: Us</span>
                  <p className="text-sm">These Cookies identify if users have accepted the use of cookies on the Website.</p>
                </li>
                <li className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <strong className="block mb-1 text-lg text-gray-900">Functionality Cookies</strong>
                  <span className="block mb-2 text-sm font-medium text-blue-600">Type: Persistent Cookies | Administered by: Us</span>
                  <p className="text-sm">These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference.</p>
                </li>
              </ul>
            </section>

            <section id="use-of-data" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Use of Your Personal Data</h2>
              <p className="mb-4">The Company may use Personal Data for the following purposes:</p>
              <ul className="pl-6 mb-8 space-y-3 list-disc marker:text-gray-400">
                <li><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</li>
                <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service.</li>
                <li><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for products or services.</li>
                <li><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication regarding updates or informative communications.</li>
                <li><strong>To provide You</strong> with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased.</li>
                <li><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</li>
                <li><strong>For business transfers:</strong> We may use Your information to evaluate or conduct a merger, divestiture, restructuring, or other sale or transfer of some or all of Our assets.</li>
                <li><strong>For other purposes:</strong> such as data analysis, identifying usage trends, and determining the effectiveness of our promotional campaigns.</li>
              </ul>

              <h3 className="mb-4 text-xl font-bold text-gray-800">Sharing Your personal information</h3>
              <p className="mb-4">We may share Your personal information in the following situations:</p>
              <ul className="pl-6 space-y-2 list-disc marker:text-gray-400">
                <li><strong>With Service Providers:</strong> To monitor and analyze the use of our Service, to contact You.</li>
                <li><strong>For business transfers:</strong> In connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition.</li>
                <li><strong>With Affiliates:</strong> We will require those affiliates to honor this Privacy Policy.</li>
                <li><strong>With business partners:</strong> To offer You certain products, services or promotions.</li>
                <li><strong>With other users:</strong> When You share personal information or otherwise interact in the public areas with other users.</li>
                <li><strong>With Your consent:</strong> We may disclose Your personal information for any other purpose with Your consent.</li>
              </ul>
            </section>

            <section id="retention-transfer" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Retention & Transfer of Data</h2>
              <h3 className="mb-3 text-xl font-bold text-gray-800">Retention of Your Personal Data</h3>
              <p className="mb-4">The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.</p>
              <p className="mb-8">The Company will also retain Usage Data for internal analysis purposes, generally for a shorter period of time, except when used to strengthen security or improve functionality.</p>

              <h3 className="mb-3 text-xl font-bold text-gray-800">Transfer of Your Personal Data</h3>
              <p className="mb-4">Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction.</p>
              <p className="mb-4">Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.</p>
            </section>

            <section id="disclosure-security" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Disclosure & Security</h2>
              
              <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
                <div className="p-6 bg-blue-50 rounded-2xl">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">Business Transactions</h3>
                  <p className="text-sm">If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred.</p>
                </div>
                <div className="p-6 bg-red-50 rounded-2xl">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">Law Enforcement</h3>
                  <p className="text-sm">Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities.</p>
                </div>
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-800">Security of Your Personal Data</h3>
              <p className="mb-4">The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>
            </section>

            <section id="children-links-changes" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Children's Privacy & Other Policies</h2>
              <h3 className="mb-2 text-lg font-bold text-gray-800">Children's Privacy</h3>
              <p className="mb-6">Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us.</p>
              
              <h3 className="mb-2 text-lg font-bold text-gray-800">Links to Other Websites</h3>
              <p className="mb-6">Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>

              <h3 className="mb-2 text-lg font-bold text-gray-800">Changes to this Privacy Policy</h3>
              <p className="mb-4">We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page and update the "Last updated" date at the top of this Privacy Policy.</p>
            </section>

            <section id="contact" className="pt-8 border-t border-gray-200 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-black text-gray-900">Contact Us</h2>
              <p className="mb-6 text-gray-600">If you have any questions about this Privacy Policy, You can contact us securely using the details below:</p>
              
              <div className="flex flex-col justify-between gap-6 p-6 text-white bg-gray-900 shadow-xl rounded-2xl sm:p-8 sm:flex-row sm:items-center">
                <div>
                  <h3 className="mb-1 text-lg font-bold">SONANI ELECTRONICS</h3>
                  <p className="mb-4 text-sm text-gray-400">Bhandariwad, Rander, Surat, Gujarat 395005.</p>
                  <div className="flex flex-col gap-2">
                    <a href="mailto:sonani.electro@gmail.com" className="flex items-center gap-3 font-medium text-blue-400 transition-colors hover:text-blue-300">
                      <FaEnvelope /> sonani.electro@gmail.com
                    </a>
                    <a href="tel:+917801891805" className="flex items-center gap-3 font-medium text-blue-400 transition-colors hover:text-blue-300">
                      <FaPhoneAlt /> +91 78018 91805
                    </a>
                  </div>
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
          h1, h2, h3, p, li { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;