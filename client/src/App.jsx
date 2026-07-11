import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, CheckCircle2, CreditCard, Home, ImagePlus, LogIn, LogOut, MessageCircle, Minus, PackagePlus, Plus, Search, Send, ShieldCheck, ShoppingCart, SlidersHorizontal, Star, Truck, UserPlus, X } from "lucide-react";
import logoUrl from "./assets/logo.jpeg";

const emptyProduct = { name: "", category: "Desktop", mrp: "", price: "", stock: "", image: "", imagePublicId: "", description: "" };
const routes = new Set(["store", "login", "signup", "orders", "chats", "admin"]);

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

function getRoute() {
  const value = window.location.hash.replace("#/", "").replace("#", "") || "store";
  return routes.has(value) ? value : "store";
}

function go(route) {
  window.location.hash = `/${route}`;
}

function ProductVisual({ image }) {
  const isCustom = image?.startsWith("http://") || image?.startsWith("https://") || image?.startsWith("/");
  return (
    <div className="product-visual">
      {isCustom ? <img className="product-image" src={image} alt="" /> : <div className="no-image">No image</div>}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("mern-cart") || "[]"));
  const [category, setCategory] = useState("All");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");

  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category))], [products]);
  const visibleProducts = category === "All" ? products : products.filter((product) => product.category === category);
  const cartLines = cart.map((item) => ({ ...item, product: products.find((product) => product._id === item.productId) })).filter((item) => item.product);
  const cartTotal = cartLines.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    loadProducts();
    api("/api/me").then((data) => setUser(data.user));
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("mern-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) loadOrders();
    if (user?.role === "admin") loadAdmin();
    if (user) loadChats();
  }, [user]);

  useEffect(() => {
    if (route === "admin" && user?.role === "admin") loadAdmin();
    if (route === "orders" && user) loadOrders();
    if (route === "chats" && user) loadChats();
  }, [route]);

  useEffect(() => {
    if (!user || !["admin", "chats"].includes(route)) return undefined;
    let cancelled = false;
    async function refreshChats() {
      try {
        const data = await api("/api/chats");
        if (cancelled) return;
        if (user.role === "admin") {
          setChatThreads(data.threads || []);
          setActiveChat((current) => {
            if (!current) return data.threads?.[0] || null;
            return data.threads?.find((thread) => thread.customer === current.customer) || current;
          });
        } else {
          setActiveChat(data.thread);
        }
      } catch {
        // Keep the current chat visible if a background refresh misses.
      }
    }
    const refreshTimer = window.setInterval(refreshChats, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [route, user]);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
  }

  async function loadProducts() {
    const data = await api("/api/products");
    setProducts(data.products);
  }

  async function loadOrders() {
    const data = await api("/api/orders");
    setOrders(data.orders);
  }

  async function loadAdmin() {
    const [summaryData, orderData, chatData] = await Promise.all([api("/api/admin/summary"), api("/api/orders"), api("/api/chats")]);
    setSummary(summaryData.summary);
    setOrders(orderData.orders);
    setChatThreads(chatData.threads || []);
    setActiveChat((current) => current || chatData.threads?.[0] || null);
  }

  async function loadChats() {
    const data = await api("/api/chats");
    if (user?.role === "admin") {
      setChatThreads(data.threads || []);
      setActiveChat((current) => {
        if (!current) return data.threads?.[0] || null;
        return data.threads?.find((thread) => thread.customer === current.customer) || current;
      });
    } else {
      setActiveChat(data.thread);
    }
  }

  async function sendChatMessage(customerId, body) {
    const data = await api(`/api/chats/${customerId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
    setActiveChat(data.thread);
    if (user?.role === "admin") {
      setChatThreads((threads) => {
        const others = threads.filter((thread) => thread.customer !== data.thread.customer);
        return [data.thread, ...others];
      });
    }
    notify("Message sent");
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) => (item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { productId: product._id, quantity: 1 }];
    });
  }

  async function submitAuth(event, mode) {
    event.preventDefault();
    const path = mode === "login" ? "/api/login" : "/api/register";
    const body = mode === "login" ? { email: auth.email, password: auth.password } : auth;
    try {
      const data = await api(path, { method: "POST", body: JSON.stringify(body) });
      setUser(data.user);
      setAuth({ name: "", email: "", password: "" });
      notify(`Signed in as ${data.user.name}`);
      go(data.user.role === "admin" ? "admin" : "store");
    } catch (error) {
      notify(error.message);
    }
  }

  async function logout() {
    await api("/api/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
    setSummary(null);
    notify("Logged out");
    go("store");
  }

  async function checkout() {
    if (!user) {
      notify("Login before checkout");
      return go("login");
    }
    try {
      await api("/api/orders", { method: "POST", body: JSON.stringify({ items: cart }) });
      setCart([]);
      await loadProducts();
      await loadOrders();
      if (user.role === "admin") await loadAdmin();
      notify("Order placed");
      go("orders");
    } catch (error) {
      notify(error.message);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const path = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";
    try {
      await api(path, { method, body: JSON.stringify(productForm) });
      setProductForm(emptyProduct);
      setEditingId("");
      await loadProducts();
      await loadAdmin();
      notify("Product saved");
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
    await loadAdmin();
    notify("Product deleted");
  }

  async function updateOrder(id, status) {
    await api(`/api/admin/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    await loadAdmin();
    notify("Order updated");
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Choose an image file.");
    if (file.size > 2_000_000) return notify("Use an image under 2 MB.");
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetch("/api/upload/product-image", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Image upload failed");
      const nextProduct = { ...productForm, image: data.imageUrl, imagePublicId: data.publicId };
      setProductForm(nextProduct);
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(nextProduct)
        });
        await loadProducts();
        await loadAdmin();
        notify("Image uploaded and saved");
      } else {
        notify("Image uploaded. Save product to publish it.");
      }
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteProductImage() {
    const publicId = productForm.imagePublicId;
    try {
      if (publicId) {
        await api("/api/upload/product-image", {
          method: "DELETE",
          body: JSON.stringify({ publicId })
        });
      }
      const nextProduct = { ...productForm, image: "", imagePublicId: "" };
      setProductForm(nextProduct);
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(nextProduct)
        });
        await loadProducts();
        await loadAdmin();
        notify("Product image removed and saved");
      } else {
        notify("Product image removed");
      }
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <>
      <Header user={user} route={route} logout={logout} cartCount={cartCount} />
      <main>
        {route === "store" && (
          <StorePage
            products={products}
            categories={categories}
            category={category}
            setCategory={setCategory}
            addToCart={addToCart}
            cartLines={cartLines}
            cartTotal={cartTotal}
            setCart={setCart}
            cart={cart}
            checkout={checkout}
          />
        )}
        {route === "login" && <AuthPage mode="login" auth={auth} setAuth={setAuth} submitAuth={submitAuth} />}
        {route === "signup" && <AuthPage mode="signup" auth={auth} setAuth={setAuth} submitAuth={submitAuth} />}
        {route === "orders" && <OrdersPage user={user} orders={orders} loadOrders={loadOrders} updateOrder={updateOrder} />}
        {route === "chats" && <ChatsPage user={user} activeChat={activeChat} chatThreads={chatThreads} setActiveChat={setActiveChat} loadChats={loadChats} sendChatMessage={sendChatMessage} />}
        {route === "admin" && (
          <AdminPage
            user={user}
            summary={summary}
            products={products}
            orders={orders}
            productForm={productForm}
            setProductForm={setProductForm}
            editingId={editingId}
            setEditingId={setEditingId}
            saveProduct={saveProduct}
            deleteProduct={deleteProduct}
            handleImageUpload={handleImageUpload}
            deleteProductImage={deleteProductImage}
          />
        )}
      </main>
      {message && <div className="toast">{message}</div>}
    </>
  );
}

function Header({ user, route, logout, cartCount }) {
  return (
    <header className="site-header">
      <nav className="nav">
        <button className="brand nav-link-button" onClick={() => go("store")}>
          <span className="brand-mark"><img src={logoUrl} alt="" /></span>
          <span>Ishwarpur</span>
        </button>
        <div className="nav-actions">
          <button className={`nav-pill ${route === "store" ? "active" : ""}`} onClick={() => go("store")}><Home size={16} /> Store</button>
          {user && <button className={`nav-pill ${route === "orders" ? "active" : ""}`} onClick={() => go("orders")}>Orders</button>}
          {user && <button className={`nav-pill ${route === "chats" ? "active" : ""}`} onClick={() => go("chats")}><MessageCircle size={16} /> Chats</button>}
          {user?.role === "admin" && <button className={`nav-pill ${route === "admin" ? "active" : ""}`} onClick={() => go("admin")}>Admin</button>}
          <a className="cart-chip" href="#cart"><ShoppingCart size={16} /><span>{cartCount}</span></a>
          {user ? (
            <button className="primary-btn compact" onClick={logout}><LogOut size={17} /> Logout</button>
          ) : (
            <>
              <button className={`nav-pill ${route === "login" ? "active" : ""}`} onClick={() => go("login")}><LogIn size={16} /> Login</button>
              <button className={`nav-pill ${route === "signup" ? "active" : ""}`} onClick={() => go("signup")}><UserPlus size={16} /> Sign up</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function StorePage({ products, categories, category, setCategory, addToCart, cartLines, cartTotal, cart, setCart, checkout }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextProducts = products.filter((product) => {
      const inCategory = category === "All" || product.category === category;
      const inSearch = !normalizedQuery || [product.name, product.category, product.description].join(" ").toLowerCase().includes(normalizedQuery);
      return inCategory && inSearch;
    });
    return [...nextProducts].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "stock") return b.stock - a.stock;
      return 0;
    });
  }, [category, products, query, sort]);
  const heroProducts = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Computers, parts, and support</p>
          <h1>Info Systems</h1>
          <p>Shop reliable laptops, desktops, monitors, accessories, and networking gear with clear pricing and quick support from one place.</p>
          <div className="hero-highlights" aria-label="Store highlights">
            <span>Curated hardware</span>
            <span>Order tracking</span>
            <span>Support chat</span>
          </div>
          <div className="hero-actions">
            <a className="primary-btn" href="#products"><ShoppingCart size={18} /> Shop products</a>
            <button className="secondary-btn" onClick={() => go("signup")}><UserPlus size={18} /> Create account</button>
          </div>
        </div>
        <div className="hero-showcase" aria-label="Featured Info Systems products">
          {heroProducts.map((product, index) => (
            <article className={`hero-product hero-product-${index + 1}`} key={product._id}>
              <ProductVisual image={product.image} />
              <div>
                <strong>{product.name}</strong>
                <span>{money(product.price)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-bar">
        <div><Truck size={20} /><strong>Fast pickup</strong><span>Ready-to-ship inventory and quick order updates.</span></div>
        <div><ShieldCheck size={20} /><strong>Trusted gear</strong><span>Curated hardware for home, study, gaming, and work.</span></div>
        <div><CreditCard size={20} /><strong>Simple checkout</strong><span>Save orders to your account and track status anytime.</span></div>
      </section>

      <section className="content-section" id="products">
        <div className="section-heading">
          <div><p className="eyebrow">Featured inventory</p><h2>Computers and accessories</h2></div>
          <span className="result-count">{filteredProducts.length} items</span>
        </div>
        <div className="shop-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
          </label>
          <label className="sort-box">
            <SlidersHorizontal size={18} />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="stock">Most stock</option>
            </select>
          </label>
        </div>
        <div className="filters">
          {categories.map((item) => <button key={item} className={`filter-btn ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="shop-layout">
          <div className="product-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <article className="product-card" key={product._id}>
                <ProductVisual image={product.image} />
                <div className="product-body">
                  <div className="product-meta"><span className="tag">{product.category}</span></div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-rating"><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><span>Top pick</span></div>
                  <div className="product-buy-row">
                    <div className="price-block">
                      <span className="price-label">Selling price</span>
                      <span className="price">{money(product.price)}</span>
                      {!!product.mrp && <span className="mrp">MRP <s>{money(product.mrp)}</s></span>}
                    </div>
                    <button className="primary-btn compact" disabled={!product.stock} onClick={() => addToCart(product)}><ShoppingCart size={16} /> Add</button>
                  </div>
                </div>
              </article>
            )) : <div className="empty-state product-empty">No matching products. Try a different search or category.</div>}
          </div>
          <div id="cart" className="cart-rail">
            <CartPanel cartLines={cartLines} cartTotal={cartTotal} cart={cart} setCart={setCart} addToCart={addToCart} checkout={checkout} />
          </div>
        </div>
      </section>
    </>
  );
}

function AuthPage({ mode, auth, setAuth, submitAuth }) {
  const isSignup = mode === "signup";
  return (
    <section className="auth-page">
      <form className="panel auth-card-page" onSubmit={(event) => submitAuth(event, isSignup ? "signup" : "login")}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isSignup ? "Customer registration" : "Customer and admin access"}</p>
            <h1>{isSignup ? "Create account" : "Login"}</h1>
          </div>
          {isSignup ? <UserPlus size={26} /> : <LogIn size={26} />}
        </div>
        {isSignup && <label>Full name<input value={auth.name} onChange={(e) => setAuth({ ...auth, name: e.target.value })} required /></label>}
        <label>Email<input type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} required /></label>
        <label>Password<input type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} minLength={6} required /></label>
        <button className="primary-btn full" type="submit">{isSignup ? "Create account" : "Login"}</button>
        <button className="ghost-btn full" type="button" onClick={() => go(isSignup ? "login" : "signup")}>
          {isSignup ? "Already have an account?" : "Need a customer account?"}
        </button>
      </form>
    </section>
  );
}

function OrdersPage({ user, orders, loadOrders, updateOrder }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  if (!user) {
    return (
      <section className="auth-page">
        <div className="panel auth-card-page">
          <h1>Login required</h1>
          <p className="fine-print">Please login to view your orders.</p>
          <button className="primary-btn" onClick={() => go("login")}>Login</button>
        </div>
      </section>
    );
  }
  const orderTotal = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const processingCount = orders.filter((order) => order.status === "Processing").length;
  const completedCount = orders.filter((order) => order.status === "Completed").length;
  const isAdmin = user.role === "admin";

  return (
    <section className="content-section">
      <div className="metrics order-metrics">
        <Metric label="Total value" value={money(orderTotal)} />
        <Metric label="Orders" value={orders.length} />
        <Metric label="Processing" value={processingCount} />
        <Metric label="Completed" value={completedCount} />
      </div>
      <OrderList orders={orders} admin={isAdmin} onUpdate={updateOrder} onSelectOrder={setSelectedOrder} />
      {selectedOrder && <OrderModal order={selectedOrder} admin={isAdmin} onClose={() => setSelectedOrder(null)} />}
    </section>
  );
}

function ChatsPage({ user, activeChat, chatThreads, setActiveChat, sendChatMessage }) {
  if (!user) {
    return (
      <section className="auth-page">
        <div className="panel auth-card-page">
          <h1>Login required</h1>
          <p className="fine-print">Please login to view chats.</p>
          <button className="primary-btn" onClick={() => go("login")}>Login</button>
        </div>
      </section>
    );
  }

  return (
    <section className="content-section">
      <ChatWorkspace user={user} activeChat={activeChat} chatThreads={chatThreads} setActiveChat={setActiveChat} sendChatMessage={sendChatMessage} />
    </section>
  );
}

function ChatWorkspace({ user, activeChat, chatThreads, setActiveChat, sendChatMessage }) {
  const isAdmin = user?.role === "admin";
  return (
    <div className={`chat-workspace ${isAdmin ? "" : "customer-chat"}`}>
      {isAdmin && (
        <aside className="panel chat-list">
          <div className="panel-heading"><h3>Customers</h3><MessageCircle size={20} /></div>
          {chatThreads.length ? chatThreads.map((thread) => (
            <button type="button" className={`chat-thread-btn ${activeChat?.customer === thread.customer ? "active" : ""}`} key={thread.customer} onClick={() => setActiveChat(thread)}>
              <strong>{thread.customerName}</strong>
              <span>{thread.messages.at(-1)?.body || thread.customerEmail}</span>
            </button>
          )) : <div className="empty-state">No customer chats yet.</div>}
        </aside>
      )}
      <ChatPanel user={user} thread={activeChat} sendChatMessage={sendChatMessage} />
    </div>
  );
}

function ChatPanel({ user, thread, sendChatMessage }) {
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(null);
  const messageCount = thread?.messages.length || 0;

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [thread?._id, messageCount]);

  if (!thread) {
    return (
      <section className="panel chat-panel">
        <div className="empty-state">Select a customer chat.</div>
      </section>
    );
  }

  async function submitMessage(event) {
    event.preventDefault();
    await sendChatMessage(thread.customer, draft);
    setDraft("");
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <div>
          <h3>{user.role === "admin" ? thread.customerName : "Info Systems support"}</h3>
          <p className="fine-print">{user.role === "admin" ? thread.customerEmail : "Messages are visible to store admins."}</p>
        </div>
        <MessageCircle size={22} />
      </div>
      <div className="chat-messages" ref={messagesRef}>
        {thread.messages.length ? thread.messages.map((message) => (
          <article className={`chat-message ${message.senderRole === user.role ? "mine" : ""}`} key={message._id}>
            <div><strong>{message.senderName}</strong><span>{new Date(message.createdAt).toLocaleString()}</span></div>
            <p>{message.body}</p>
          </article>
        )) : <div className="empty-state">No messages yet.</div>}
      </div>
      <form className="chat-compose" onSubmit={submitMessage}>
        <textarea value={draft} maxLength={1000} placeholder="Type a message" onChange={(event) => setDraft(event.target.value)} required />
        <button className="primary-btn" type="submit"><Send size={17} /> Send</button>
      </form>
    </section>
  );
}

function CartPanel({ cartLines, cartTotal, cart, setCart, addToCart, checkout }) {
  return (
    <section className="panel cart-panel">
      <div className="panel-heading"><h2>Cart</h2><ShoppingCart size={22} /></div>
      <div className="cart-items">
        {cartLines.length ? cartLines.map((item) => (
          <div className="cart-item" key={item.productId}>
            <div className="cart-row"><strong>{item.product.name}</strong><span>{money(item.product.price * item.quantity)}</span></div>
            <div className="quantity-controls">
              <button className="icon-btn" aria-label={`Decrease ${item.product.name}`} onClick={() => setCart(cart.map((row) => row.productId === item.productId ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}><Minus size={16} /></button>
              <strong>{item.quantity}</strong>
              <button className="icon-btn" aria-label={`Increase ${item.product.name}`} onClick={() => addToCart(item.product)}><Plus size={16} /></button>
              <button className="icon-btn" aria-label={`Remove ${item.product.name}`} onClick={() => setCart(cart.filter((row) => row.productId !== item.productId))}><X size={16} /></button>
            </div>
          </div>
        )) : <div className="empty-state">Your cart is empty.</div>}
      </div>
      <div className="cart-total"><span>Total</span><strong>{money(cartTotal)}</strong></div>
      <button className="primary-btn full" disabled={!cartLines.length} onClick={checkout}><CheckCircle2 size={18} /> Checkout</button>
    </section>
  );
}

function AdminPage(props) {
  const { user, summary, products, productForm, setProductForm, editingId, setEditingId, saveProduct, deleteProduct, handleImageUpload, deleteProductImage } = props;
  if (user?.role !== "admin") {
    return (
      <section className="auth-page">
        <div className="panel auth-card-page">
          <h1>Admin login required</h1>
          <p className="fine-print">Login with the admin account to access the dashboard.</p>
          <button className="primary-btn" onClick={() => go("login")}>Login</button>
        </div>
      </section>
    );
  }
  return (
    <section className="content-section admin-section">
      <div className="metrics">
        <Metric label="Revenue" value={money(summary?.revenue)} />
        <Metric label="Orders" value={summary?.orders || 0} />
        <Metric label="Products" value={summary?.products || 0} />
        <Metric label="Customers" value={summary?.customers || 0} />
      </div>
      <div className="admin-card-grid">
        <button className="admin-action-card" type="button" onClick={() => go("admin")}>
          <PackagePlus size={24} />
          <strong>Products</strong>
          <span>Add items, update pricing, edit product images, and manage inventory.</span>
        </button>
        <button className="admin-action-card" type="button" onClick={() => go("orders")}>
          <ShoppingCart size={24} />
          <strong>Orders</strong>
          <span>Open the separate orders page to review purchases and update order status.</span>
        </button>
        <button className="admin-action-card" type="button" onClick={() => go("chats")}>
          <MessageCircle size={24} />
          <strong>Chats</strong>
          <span>Open customer conversations on the dedicated support page.</span>
        </button>
      </div>
      <div className="admin-layout">
        <form className="panel admin-form" onSubmit={saveProduct}>
          <div className="panel-heading"><h3>{editingId ? "Edit product" : "Add product"}</h3><PackagePlus size={22} /></div>
          <label>Product name<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></label>
          <label>Category<select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}><option>Desktop</option><option>Laptop</option><option>Monitor</option><option>Accessory</option><option>Networking</option></select></label>
          <div className="form-row three-fields">
            <label>MRP<input type="number" value={productForm.mrp || ""} min="1" step="0.01" onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })} required /></label>
            <label>Selling price<input type="number" value={productForm.price} min="1" step="0.01" onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required /></label>
            <label>Stock<input type="number" value={productForm.stock} min="0" step="1" onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required /></label>
          </div>
          <label>Image path<input value={productForm.image?.startsWith("http") || productForm.image?.startsWith("/") ? productForm.image : ""} placeholder="/uploads/products/example.jpg" onChange={(e) => setProductForm({ ...productForm, image: e.target.value, imagePublicId: "" })} /></label>
          <label>Upload product image<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
          <div className="image-preview">
            <ProductVisual image={productForm.image} />
            <button className="ghost-btn full remove-image-btn" type="button" onClick={deleteProductImage} disabled={!productForm.image && !productForm.imagePublicId}>Remove image</button>
          </div>
          <label>Description<textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required /></label>
          <div className="form-actions"><button className="primary-btn" type="submit"><ImagePlus size={17} /> Save</button><button className="ghost-btn" type="button" onClick={() => { setProductForm(emptyProduct); setEditingId(""); }}>Reset</button></div>
        </form>

        <div className="panel">
          <div className="panel-heading"><h3>Inventory</h3><Boxes size={22} /></div>
          <div className="admin-inventory-grid">
            {products.map((product) => (
              <article className="admin-inventory-card" key={product._id}>
                <ProductVisual image={product.image} />
                <div className="admin-inventory-body">
                  <div className="product-meta">
                    <span className="tag">{product.category}</span>
                  </div>
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                  </div>
                  <div className="inventory-insights">
                    <div><span>MRP</span><strong>{money(product.mrp || product.price)}</strong></div>
                    <div><span>Selling</span><strong>{money(product.price)}</strong></div>
                    <div><span>Stock</span><strong>{product.stock}</strong></div>
                  </div>
                  <div className="form-actions">
                    <button className="ghost-btn compact" onClick={() => { setEditingId(product._id); setProductForm({ ...product }); }}>Edit</button>
                    <button className="ghost-btn compact danger-btn" onClick={() => deleteProduct(product._id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function OrderList({ orders, admin, onUpdate, onSelectOrder }) {
  if (!orders.length) return <div className="empty-state">No orders yet.</div>;
  return (
    <div className="orders-list">
      {orders.map((order) => (
        <article className="order-card clickable-card" key={order._id} role="button" tabIndex={0} onClick={() => onSelectOrder(order)} onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectOrder(order);
          }
        }}>
          <div className="order-meta"><strong>{admin ? order.customerName : `Order ${order._id.slice(-8)}`}</strong><span className="tag">{order.status}</span></div>
          <p>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
          <div className="order-meta"><span>{new Date(order.createdAt).toLocaleString()}</span><strong>{money(order.total)}</strong></div>
          {admin && <div className="form-actions"><select defaultValue={order.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(order._id, event.target.value)}><option>Processing</option><option>Ready</option><option>Completed</option><option>Cancelled</option></select></div>}
        </article>
      ))}
    </div>
  );
}

function OrderModal({ order, admin, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{admin ? order.customerEmail : "Order details"}</p>
            <h2 id="order-modal-title">{admin ? order.customerName : `Order ${order._id.slice(-8)}`}</h2>
          </div>
          <button className="icon-btn" aria-label="Close order details" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="order-modal-summary">
          <div><span>Status</span><strong>{order.status}</strong></div>
          <div><span>Total</span><strong>{money(order.total)}</strong></div>
          <div><span>Placed</span><strong>{new Date(order.createdAt).toLocaleString()}</strong></div>
        </div>
        <div className="order-line-items">
          {order.items.map((item) => (
            <div className="order-line-item" key={`${order._id}-${item.name}`}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.quantity} x {money(item.price)}</span>
              </div>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
