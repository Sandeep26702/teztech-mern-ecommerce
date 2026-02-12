export const PRODUCT_CATEGORIES = [
  { id: 1, name: "POLY SHEET", icon: "📄" },
  { id: 2, name: "LED PRODUCTS", icon: "💡" },
  { id: 3, name: "SCROLLING LED DISPLAY BOARDS", icon: "📺" },
  { id: 4, name: "LED CONTROLLER", icon: "🎛️" },
  { id: 5, name: "SMPS POWER SUPPLY", icon: "🔌" },
  { id: 6, name: "SD CARDS", icon: "💾" },
  { id: 7, name: "CONNECTOR AND SWITCHES", icon: "🔗" },
  { id: 8, name: "IC", icon: "🔲" },
  { id: 9, name: "PCB", icon: "🟢" },
  { id: 10, name: "MODULES & SENSORS", icon: "📡" },
  { id: 11, name: "WIRES & CABLES", icon: "🔌" },
  { id: 12, name: "FRAMING MATERIALS", icon: "🔧" },
  { id: 13, name: "NYLON CABLE TIES", icon: "🔗" },
  { id: 14, name: "PELTIER & ACC", icon: "❄️" },
  { id: 15, name: "SOFTWARES & OTHER", icon: "💿" },
  { id: 16, name: "KNOWLEDGE CENTRE", icon: "📚" },
  { id: 17, name: "ELE.COMPONT", icon: "⚡" },
  { id: 18, name: "ENCLOSURES", icon: "📦" },
  { id: 19, name: "ART&CRAFT", icon: "🎨" },
  { id: 20, name: "Partner Network Products", icon: "🤝" },
  { id: 21, name: "RAW MATERIALS", icon: "🏗️" },
  { id: 22, name: "LIGHTING AUTOMATION", icon: "🏠" },
  { id: 23, name: "CORNER", icon: "📐" }
];

export const CATEGORY_ITEMS = {
  1: { 
    name: "POLY SHEET", 
    items: [
      { name: "Transparent Poly Sheet", price: 250 },
      { name: "Colored Poly Sheet", price: 300 },
      { name: "Anti-Static Poly Sheet", price: 350 }
    ]
  },
  2: { 
    name: "LED PRODUCTS", 
    items: [
      { name: "LED Strips", price: 450 },
      { name: "LED Bulbs", price: 500 },
      { name: "LED Panels", price: 550 },
      { name: "LED Modules", price: 600 }
    ]
  },
  3: { 
    name: "SCROLLING LED DISPLAY BOARDS", 
    items: [
      { name: "Indoor Display", price: 650 },
      { name: "Outdoor Display", price: 700 },
      { name: "Multi-color Display", price: 750 }
    ]
  },
  4: { 
    name: "LED CONTROLLER", 
    items: [
      { name: "RGB Controller", price: 550 },
      { name: "DMX Controller", price: 600 },
      { name: "WiFi Controller", price: 650 }
    ]
  },
  5: { 
    name: "SMPS POWER SUPPLY", 
    items: [
      { name: "12V SMPS", price: 650 },
      { name: "24V SMPS", price: 700 },
      { name: "5V SMPS", price: 750 },
      { name: "Variable SMPS", price: 800 }
    ]
  },
  6: { 
    name: "SD CARDS", 
    items: [
      { name: "16GB SD Card", price: 750 },
      { name: "32GB SD Card", price: 800 },
      { name: "64GB SD Card", price: 850 },
      { name: "128GB SD Card", price: 900 }
    ]
  },
  7: { 
    name: "CONNECTOR AND SWITCHES", 
    items: [
      { name: "USB Connectors", price: 850 },
      { name: "Power Switches", price: 900 },
      { name: "Toggle Switches", price: 950 }
    ]
  },
  8: { 
    name: "IC", 
    items: [
      { name: "Microcontrollers", price: 950 },
      { name: "Operational Amplifiers", price: 1000 },
      { name: "Logic Gates", price: 1050 },
      { name: "Memory ICs", price: 1100 }
    ]
  },
  9: { 
    name: "PCB", 
    items: [
      { name: "Single Layer PCB", price: 1050 },
      { name: "Double Layer PCB", price: 1100 },
      { name: "Multi Layer PCB", price: 1150 }
    ]
  },
  10: { 
    name: "MODULES & SENSORS", 
    items: [
      { name: "Temperature Sensors", price: 1150 },
      { name: "Motion Sensors", price: 1200 },
      { name: "Light Sensors", price: 1250 }
    ]
  },
  11: { 
    name: "WIRES & CABLES", 
    items: [
      { name: "Jumper Wires", price: 150 },
      { name: "USB Cables", price: 200 },
      { name: "Power Cables", price: 250 },
      { name: "HDMI Cables", price: 300 }
    ]
  },
  12: { 
    name: "FRAMING MATERIALS", 
    items: [
      { name: "Aluminum Frame", price: 500 },
      { name: "Plastic Frame", price: 300 },
      { name: "Steel Frame", price: 700 }
    ]
  },
  13: { 
    name: "NYLON CABLE TIES", 
    items: [
      { name: "Small Cable Ties", price: 50 },
      { name: "Medium Cable Ties", price: 75 },
      { name: "Large Cable Ties", price: 100 }
    ]
  },
  14: { 
    name: "PELTIER & ACC", 
    items: [
      { name: "Peltier Cooler", price: 800 },
      { name: "Heat Sink", price: 400 },
      { name: "Thermal Paste", price: 150 }
    ]
  },
  15: { 
    name: "SOFTWARES & OTHER", 
    items: [
      { name: "Programming Software", price: 2000 },
      { name: "Design Tools", price: 1500 },
      { name: "Simulation Software", price: 2500 }
    ]
  },
  16: { 
    name: "KNOWLEDGE CENTRE", 
    items: [
      { name: "Electronics Books", price: 500 },
      { name: "Tutorial Videos", price: 300 },
      { name: "Online Courses", price: 1000 }
    ]
  },
  17: { 
    name: "ELE.COMPONT", 
    items: [
      { name: "Resistors Pack", price: 200 },
      { name: "Capacitors Pack", price: 300 },
      { name: "Transistors Pack", price: 400 }
    ]
  },
  18: { 
    name: "ENCLOSURES", 
    items: [
      { name: "Plastic Enclosure", price: 350 },
      { name: "Metal Enclosure", price: 600 },
      { name: "Waterproof Enclosure", price: 800 }
    ]
  },
  19: { 
    name: "ART&CRAFT", 
    items: [
      { name: "LED Art Kit", price: 450 },
      { name: "Circuit Art Board", price: 300 },
      { name: "Creative Electronics Kit", price: 700 }
    ]
  },
  20: { 
    name: "Partner Network Products", 
    items: [
      { name: "Partner Module A", price: 900 },
      { name: "Partner Module B", price: 1100 },
      { name: "Partner Kit", price: 1500 }
    ]
  },
  21: { 
    name: "RAW MATERIALS", 
    items: [
      { name: "Copper Wire", price: 200 },
      { name: "Solder Wire", price: 150 },
      { name: "PCB Material", price: 400 }
    ]
  },
  22: { 
    name: "LIGHTING AUTOMATION", 
    items: [
      { name: "Smart Switch", price: 800 },
      { name: "Motion Light Sensor", price: 600 },
      { name: "Dimmer Controller", price: 700 }
    ]
  },
  23: { 
    name: "CORNER", 
    items: [
      { name: "Corner Bracket", price: 100 },
      { name: "Corner Connector", price: 150 },
      { name: "Corner Mount", price: 200 }
    ]
  }
};