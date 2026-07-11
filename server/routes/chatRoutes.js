const express = require("express");
const ChatThread = require("../models/ChatThread");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

function formatThread(thread) {
  return {
    _id: thread._id,
    customer: thread.customer,
    customerName: thread.customerName,
    customerEmail: thread.customerEmail,
    lastMessageAt: thread.lastMessageAt,
    updatedAt: thread.updatedAt,
    messages: thread.messages
  };
}

async function getOrCreateThread(customer) {
  let thread = await ChatThread.findOne({ customer: customer._id });
  if (!thread) {
    thread = await ChatThread.create({
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      messages: []
    });
  }
  return thread;
}

router.get("/", auth, async (req, res) => {
  if (req.user.role === "admin") {
    const customers = await User.find({ role: "customer" }).sort({ name: 1 });
    await Promise.all(customers.map((customer) => getOrCreateThread(customer)));
    const threads = await ChatThread.find().sort({ lastMessageAt: -1, updatedAt: -1 });
    return res.json({ threads: threads.map(formatThread) });
  }

  const thread = await getOrCreateThread(req.user);
  res.json({ thread: formatThread(thread) });
});

router.get("/:customerId", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  const customer = await User.findById(req.params.customerId);
  if (!customer || customer.role !== "customer") return res.status(404).json({ error: "Customer not found." });
  const thread = await getOrCreateThread(customer);
  res.json({ thread: formatThread(thread) });
});

router.post("/:customerId/messages", auth, async (req, res) => {
  const body = String(req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Enter a message." });
  if (body.length > 1000) return res.status(400).json({ error: "Message must be under 1000 characters." });

  const customerId = req.user.role === "admin" ? req.params.customerId : req.user._id;
  const customer = await User.findById(customerId);
  if (!customer || customer.role !== "customer") return res.status(404).json({ error: "Customer not found." });

  const thread = await getOrCreateThread(customer);
  thread.messages.push({
    sender: req.user._id,
    senderName: req.user.name,
    senderRole: req.user.role,
    body
  });
  thread.lastMessageAt = new Date();
  await thread.save();
  res.status(201).json({ thread: formatThread(thread) });
});

module.exports = router;
