const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const CarouselSlide = require("../models/CarouselSlide");
const Order = require("../models/Order");
const ChatThread = require("../models/ChatThread");

const products = [
  { name: "Apex Gaming Tower", category: "Desktop", mrp: 1549, price: 1299, stock: 8, image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=900&q=80", description: "Ryzen 7, RTX graphics, 32GB RAM, 1TB NVMe SSD, tempered glass case." },
  { name: "NovaBook Pro 14", category: "Laptop", mrp: 1199, price: 999, stock: 12, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80", description: "Portable performance laptop with Intel Core i7, 16GB RAM, 512GB SSD." },
  { name: "Creator 27 Monitor", category: "Monitor", mrp: 399, price: 329, stock: 17, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80", description: "27-inch QHD IPS display with accurate color and ergonomic stand." },
  { name: "RapidKey Mechanical Keyboard", category: "Accessory", mrp: 119, price: 89, stock: 30, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80", description: "Hot-swappable switches, white backlight, aluminum top plate." },
  { name: "Precision Wireless Mouse", category: "Accessory", mrp: 79, price: 59, stock: 24, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80", description: "Ergonomic wireless mouse with adjustable DPI and USB-C charging." },
  { name: "SecureHome Router AX", category: "Networking", mrp: 189, price: 149, stock: 10, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80", description: "Wi-Fi 6 router with strong coverage, guest network, and parental controls." },
  { name: "StudioDock USB-C Hub", category: "Accessory", mrp: 149, price: 119, stock: 19, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80", description: "Seven-port USB-C dock with HDMI, ethernet, SD reader, and 100W passthrough charging." },
  { name: "Vector Mini Workstation", category: "Desktop", mrp: 1899, price: 1599, stock: 5, image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=80", description: "Compact workstation with 12-core CPU, RTX graphics, 64GB RAM, and quiet cooling." },
  { name: "FlexBook Air 13", category: "Laptop", mrp: 899, price: 749, stock: 14, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80", description: "Lightweight student and business laptop with all-day battery life and fast SSD storage." },
  { name: "UltraView 34 Curved", category: "Monitor", mrp: 599, price: 499, stock: 9, image: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?auto=format&fit=crop&w=900&q=80", description: "34-inch ultrawide curved display for multitasking, design work, and immersive gaming." },
  { name: "StreamCam Pro", category: "Accessory", mrp: 159, price: 129, stock: 22, image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=900&q=80", description: "1080p webcam with autofocus, dual microphones, and low-light correction." },
  { name: "MeshNode Wi-Fi 6 Pack", category: "Networking", mrp: 279, price: 229, stock: 7, image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80", description: "Three-node mesh networking kit for whole-home coverage and easy app-based setup." },
  { name: "CoreBox Office PC", category: "Desktop", mrp: 699, price: 579, stock: 11, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80", description: "Compact desktop for billing, office work, online classes, and daily business tasks." },
  { name: "Pulse RGB Gaming PC", category: "Desktop", mrp: 1299, price: 1099, stock: 6, image: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?auto=format&fit=crop&w=900&q=80", description: "Gaming desktop with RGB cooling, fast SSD storage, and smooth 1080p performance." },
  { name: "Ledger Mini Desktop", category: "Desktop", mrp: 549, price: 459, stock: 16, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80", description: "Small form-factor system for shops, counters, accounting, and compact desks." },
  { name: "ThinkLite Business 15", category: "Laptop", mrp: 849, price: 699, stock: 13, image: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=900&q=80", description: "Reliable 15-inch business laptop with numeric keyboard, SSD, and strong battery life." },
  { name: "StudyMate Chromebook", category: "Laptop", mrp: 399, price: 329, stock: 18, image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80", description: "Simple student laptop for browsing, assignments, video classes, and cloud apps." },
  { name: "GameBook RTX 16", category: "Laptop", mrp: 1499, price: 1299, stock: 5, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80", description: "High-performance laptop for gaming, editing, rendering, and creative workloads." },
  { name: "ViewSharp 24 IPS", category: "Monitor", mrp: 229, price: 179, stock: 20, image: "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=900&q=80", description: "24-inch IPS monitor with crisp colors for office, study, and everyday browsing." },
  { name: "ProColor 32 Display", category: "Monitor", mrp: 529, price: 449, stock: 8, image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=900&q=80", description: "Large 32-inch display for design, multitasking, spreadsheets, and content work." },
  { name: "SwiftScreen Portable", category: "Monitor", mrp: 249, price: 199, stock: 12, image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80", description: "Slim portable screen for laptop users who need a second display anywhere." },
  { name: "ClearVoice Headset", category: "Accessory", mrp: 79, price: 49, stock: 26, image: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=900&q=80", description: "Comfortable headset with clear microphone for calls, classes, and support desks." },
  { name: "PowerGuard UPS 1000", category: "Accessory", mrp: 189, price: 149, stock: 15, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80", description: "Backup power protection for desktops, routers, billing systems, and monitors." },
  { name: "TypeFlow Wireless Combo", category: "Accessory", mrp: 69, price: 49, stock: 35, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80", description: "Wireless keyboard and mouse combo for clean desks and everyday typing." },
  { name: "CablePro HDMI Kit", category: "Accessory", mrp: 29, price: 19, stock: 40, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80", description: "Essential HDMI and display cable kit for monitors, projectors, and PCs." },
  { name: "RangeMax Wi-Fi Extender", category: "Networking", mrp: 99, price: 79, stock: 17, image: "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?auto=format&fit=crop&w=900&q=80", description: "Plug-in extender to improve wireless coverage in rooms, shops, and offices." },
  { name: "SwitchPro 8-Port", category: "Networking", mrp: 89, price: 69, stock: 14, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80", description: "Gigabit network switch for connecting PCs, printers, cameras, and access points." },
  { name: "FiberReady Modem", category: "Networking", mrp: 169, price: 139, stock: 9, image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80", description: "Fast internet modem-router setup for stable home and shop connectivity." }
];

const demoCustomers = [
  { name: "Ananya Rao", email: "ananya@infosystems.local" },
  { name: "Rohan Mehta", email: "rohan@infosystems.local" },
  { name: "Maya Patel", email: "maya@infosystems.local" }
];

const carouselSlides = [
  {
    eyebrow: "Exclusive offer",
    title: "Build-ready desktop deals",
    body: "Save on gaming and workstation towers with curated accessories for your complete setup.",
    badge: "Limited stock",
    buttonLabel: "Shop desktops",
    buttonRoute: "#products",
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    active: true
  },
  {
    eyebrow: "Student pick",
    title: "Laptop bundles for study and work",
    body: "Pair lightweight laptops with mice, hubs, and webcams for a simple everyday kit.",
    badge: "Bundle value",
    buttonLabel: "View laptops",
    buttonRoute: "#products",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
    active: true
  },
  {
    eyebrow: "Store special",
    title: "Upgrade your desk display",
    body: "Monitors, docks, and networking essentials selected for cleaner home and office setups.",
    badge: "New arrivals",
    buttonLabel: "Explore offers",
    buttonRoute: "#products",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 3,
    active: true
  }
];

async function seedDatabase() {
  const admin = await upsertUser({ name: "Info Systems Admin", email: "admin@infosystems.local", password: "admin123", role: "admin" });
  const customers = await Promise.all(demoCustomers.map((customer) => upsertUser({ ...customer, password: "customer123", role: "customer" })));

  for (const product of products) {
    await Product.updateOne(
      { name: product.name },
      { $set: product, $setOnInsert: { imagePublicId: "" } },
      { upsert: true }
    );
  }

  for (const slide of carouselSlides) {
    await CarouselSlide.updateOne(
      { title: slide.title },
      { $setOnInsert: slide },
      { upsert: true }
    );
  }

  const seededProducts = await Product.find({ name: { $in: products.map((product) => product.name) } });
  await seedOrders(customers, seededProducts);
  await seedChats(admin, customers);
}

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, password: await bcrypt.hash(password, 12), role });
}

async function seedOrders(customers, seededProducts) {
  if (await Order.exists({ customerEmail: { $in: demoCustomers.map((customer) => customer.email) } })) return;

  const byName = new Map(seededProducts.map((product) => [product.name, product]));
  const orderPlans = [
    { customer: customers[0], status: "Completed", items: [["NovaBook Pro 14", 1], ["StudioDock USB-C Hub", 1], ["Precision Wireless Mouse", 1]] },
    { customer: customers[1], status: "Ready", items: [["Apex Gaming Tower", 1], ["RapidKey Mechanical Keyboard", 1], ["UltraView 34 Curved", 1]] },
    { customer: customers[2], status: "Processing", items: [["MeshNode Wi-Fi 6 Pack", 1], ["SecureHome Router AX", 1]] },
    { customer: customers[0], status: "Processing", items: [["StreamCam Pro", 2], ["Creator 27 Monitor", 1]] }
  ];

  await Order.insertMany(orderPlans.map((plan) => {
    const items = plan.items.map(([name, quantity]) => {
      const product = byName.get(name);
      return { product: product._id, name: product.name, price: product.price, quantity };
    });
    return {
      user: plan.customer._id,
      customerName: plan.customer.name,
      customerEmail: plan.customer.email,
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: plan.status
    };
  }));
}

async function seedChats(admin, customers) {
  for (const customer of customers) {
    if (await ChatThread.exists({ customer: customer._id })) continue;

    await ChatThread.create({
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      lastMessageAt: new Date(),
      messages: [
        {
          sender: customer._id,
          senderName: customer.name,
          senderRole: "customer",
          body: "Hi, can you help me choose the right setup for my workspace?"
        },
        {
          sender: admin._id,
          senderName: admin.name,
          senderRole: "admin",
          body: "Absolutely. Tell me your budget and whether you prefer laptop, desktop, or hybrid."
        }
      ]
    });
  }
}

module.exports = seedDatabase;
