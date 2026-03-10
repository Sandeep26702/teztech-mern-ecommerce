export const PRODUCT_CATEGORIES = [
  { id: 1, name: "Poly Sheet", slug: "poly-sheet", description: "High-quality durable poly sheets.", icon: "📋", color: "bg-blue-50 text-blue-600" },
  { id: 2, name: "LED Products", slug: "led-products", description: "Modules, strips, and display LEDs.", icon: "💡", color: "bg-yellow-50 text-yellow-600" },
  { id: 3, name: "Scrolling LED Boards", slug: "scrolling-led", description: "Programmable scrolling display boards.", icon: "📟", color: "bg-red-50 text-red-600" },
  { id: 4, name: "LED Controller", slug: "led-controller", description: "Controllers for dynamic LED effects.", icon: "🎛️", color: "bg-purple-50 text-purple-600" },
  { id: 5, name: "SMPS Power Supply", slug: "smps", description: "Reliable SMPS power supply units.", icon: "🔌", color: "bg-green-50 text-green-600" },
  { id: 6, name: "SD Cards", slug: "sd-cards", description: "Memory cards for storage modules.", icon: "💾", color: "bg-gray-100 text-gray-700" },
  { id: 7, name: "Connector & Switches", slug: "connectors-switches", description: "Various connectors and toggle switches.", icon: "🔗", color: "bg-indigo-50 text-indigo-600" },
  { id: 8, name: "IC (Integrated Circuits)", slug: "ic", description: "Timers, logic gates, and microchips.", icon: "🖲️", color: "bg-pink-50 text-pink-600" },
  { id: 9, name: "PCB", slug: "pcb", description: "Printed Circuit Boards for your projects.", icon: "🟩", color: "bg-emerald-50 text-emerald-600" },
  { id: 10, name: "Modules & Sensors", slug: "modules-sensors", description: "Ultrasonic, IR, and temperature sensors.", icon: "📡", color: "bg-cyan-50 text-cyan-600" },
  { id: 11, name: "Wires & Cables", slug: "wires-cables", description: "Jumper wires, ribbon cables, and more.", icon: "🧶", color: "bg-orange-50 text-orange-600" },
  { id: 12, name: "Framing Materials", slug: "framing", description: "Materials for structural framing.", icon: "🏗️", color: "bg-stone-100 text-stone-600" },
  { id: 13, name: "Nylon Cable Ties", slug: "cable-ties", description: "Strong and durable nylon zip ties.", icon: "🎗️", color: "bg-lime-50 text-lime-600" },
  { id: 14, name: "Peltier & ACC", slug: "peltier", description: "Thermoelectric cooling modules & accessories.", icon: "❄️", color: "bg-sky-50 text-sky-600" },
  { id: 15, name: "Softwares & Other", slug: "software", description: "Tools and utility softwares.", icon: "💻", color: "bg-blue-50 text-blue-700" },
  { id: 16, name: "Knowledge Centre", slug: "knowledge-centre", description: "Guides, tutorials, and documentations.", icon: "📚", color: "bg-amber-50 text-amber-600" },
  { id: 17, name: "Electronic Components", slug: "ele-compont", description: "Basic resistors, capacitors, and diodes.", icon: "⚙️", color: "bg-teal-50 text-teal-600" },
  { id: 18, name: "Enclosures", slug: "enclosures", description: "Project boxes and protective casings.", icon: "📦", color: "bg-rose-50 text-rose-600" },
  { id: 19, name: "Art & Craft", slug: "art-craft", description: "Materials for aesthetic project designs.", icon: "🎨", color: "bg-fuchsia-50 text-fuchsia-600" },
  { id: 20, name: "Partner Network Products", slug: "partner-products", description: "Exclusive products from our partners.", icon: "🤝", color: "bg-violet-50 text-violet-600" },
  { id: 21, name: "Raw Materials", slug: "raw-materials", description: "Basic raw materials for manufacturing.", icon: "🧱", color: "bg-amber-100 text-amber-700" },
  { id: 22, name: "Lighting Automation", slug: "lighting-automation", description: "Smart lighting control systems.", icon: "🏠", color: "bg-indigo-100 text-indigo-700" },
  { id: 23, name: "Corner", slug: "corner", description: "Corner pieces and structural joints.", icon: "📐", color: "bg-slate-100 text-slate-600" },
];

export const getCategoryNameFromSlug = (slug = "") => {
  const found = PRODUCT_CATEGORIES.find((item) => item.slug === slug);
  return found?.name || "";
};
