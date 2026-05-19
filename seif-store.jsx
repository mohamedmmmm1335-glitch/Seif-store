import { useState, useEffect, useRef } from "react";

// ============================================================
// FIREBASE CONFIG — استبدل بـ config بتاعك
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

// ============================================================
// LOCAL MOCK DB (يشتغل من غير Firebase لو مش متصل)
// ============================================================
let mockDB = {
  products: [
    { id: "p1", name: "بدلة كلاسيك أسود", category: "بدل رجالي", price: 2500, stock: 8, image: "👔", description: "بدلة كلاسيكية فاخرة قماش إيطالي", sizes: ["46","48","50","52","54"] },
    { id: "p2", name: "بدلة عريس ملكي", category: "بدل عريس", price: 4500, stock: 3, image: "🤵", description: "بدلة عريس بتصميم ملكي مطرز", sizes: ["46","48","50","52"] },
    { id: "p3", name: "سموكن ذهبي", category: "سموكن", price: 3200, stock: 5, image: "🎩", description: "سموكن فاخر للمناسبات الخاصة", sizes: ["48","50","52","54"] },
    { id: "p4", name: "بدلة نهارية بيضاء", category: "بدل رجالي", price: 1800, stock: 12, image: "👗", description: "بدلة بيضاء خفيفة للحفلات", sizes: ["46","48","50","52","54","56"] },
  ],
  orders: [
    { id: "o1", customer: "أحمد محمد", phone: "01012345678", product: "بدلة عريس ملكي", size: "50", status: "جاري", date: "2026-05-18", total: 4500, notes: "تسليم قبل الفرح بأسبوع" },
    { id: "o2", customer: "محمود علي", phone: "01198765432", product: "سموكن ذهبي", size: "52", status: "جاهز", date: "2026-05-15", total: 3200, notes: "" },
    { id: "o3", customer: "خالد حسن", phone: "01234567890", product: "بدلة كلاسيك أسود", size: "48", status: "تسليم", date: "2026-05-10", total: 2500, notes: "دفع مقدم 1000" },
  ],
  appointments: [
    { id: "a1", customer: "سامي فريد", phone: "01011223344", date: "2026-05-22", time: "10:00", type: "قياس", notes: "بدلة عريس", status: "مؤكد" },
    { id: "a2", customer: "عمر زيد", phone: "01155667788", date: "2026-05-23", time: "14:00", type: "تسليم", notes: "", status: "مؤكد" },
    { id: "a3", customer: "يوسف أحمد", phone: "01099887766", date: "2026-05-25", time: "11:00", type: "استفسار", notes: "سعر بدل الأفراح", status: "انتظار" },
  ],
};

// Simple unique id
const uid = () => Math.random().toString(36).slice(2, 9);

// ============================================================
// DESIGN TOKENS
// ============================================================
const G = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  black: "#0A0A0A",
  surface: "#111111",
  card: "#181818",
  border: "#2A2A2A",
  text: "#F0E6CC",
  muted: "#888",
};

// ============================================================
// GLOBAL STYLES
// ============================================================
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html { background: #0A0A0A; color: #F0E6CC; font-family: 'Cairo', sans-serif; direction: rtl; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #C9A84C55; border-radius: 3px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .gold-shimmer { background: linear-gradient(90deg, #C9A84C, #E8C97A, #A07830, #E8C97A, #C9A84C); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
  input, textarea, select { background: #1A1A1A; border: 1px solid #2A2A2A; color: #F0E6CC; font-family: 'Cairo', sans-serif; border-radius: 8px; padding: 10px 14px; width: 100%; font-size: 14px; outline: none; transition: border-color 0.2s; direction: rtl; }
  input:focus, textarea:focus, select:focus { border-color: #C9A84C; }
  button { cursor: pointer; font-family: 'Cairo', sans-serif; }
`;

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
function GoldBtn({ children, onClick, style, variant = "primary", size = "md" }) {
  const base = {
    border: "none", borderRadius: 8, fontWeight: 700, fontFamily: "Cairo", cursor: "pointer",
    transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "14px 32px" : "10px 20px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
  };
  const variants = {
    primary: { background: "linear-gradient(135deg, #C9A84C, #E8C97A, #A07830)", color: "#0A0A0A" },
    ghost: { background: "transparent", border: "1px solid #C9A84C55", color: "#C9A84C" },
    danger: { background: "#3A1A1A", border: "1px solid #8B2020", color: "#FF6666" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >{children}</button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Badge({ children, color = "gold" }) {
  const colors = {
    gold: { bg: "#C9A84C22", text: "#E8C97A", border: "#C9A84C44" },
    green: { bg: "#1A3A1A", text: "#66BB66", border: "#2A5A2A" },
    blue: { bg: "#1A1A3A", text: "#6666FF", border: "#2A2A5A" },
    red: { bg: "#3A1A1A", text: "#FF6666", border: "#5A2A2A" },
    gray: { bg: "#2A2A2A", text: "#888", border: "#333" },
  };
  const c = colors[color] || colors.gold;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: G.gold }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: G.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = G.gold }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 32, background: `${color}22`, padding: 12, borderRadius: 12 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 13, color: G.muted }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: G.goldDark, marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ============================================================
// PAGES
// ============================================================

// ---- DASHBOARD ----
function Dashboard({ data }) {
  const totalRevenue = data.orders.reduce((s, o) => s + o.total, 0);
  const pending = data.orders.filter(o => o.status === "جاري").length;
  const lowStock = data.products.filter(p => p.stock <= 3).length;
  const todayAppts = data.appointments.filter(a => a.date === new Date().toISOString().slice(0,10)).length;

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: G.gold }}>🏠 لوحة التحكم</h2>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="💰" label="إجمالي الإيرادات" value={`${totalRevenue.toLocaleString()} ج`} color={G.gold} />
        <StatCard icon="📦" label="إجمالي المنتجات" value={data.products.length} sub={lowStock > 0 ? `⚠️ ${lowStock} مخزون منخفض` : "✅ المخزون كويس"} color="#66BB66" />
        <StatCard icon="🛍️" label="الطلبات" value={data.orders.length} sub={`${pending} قيد التنفيذ`} color="#E8C97A" />
        <StatCard icon="📅" label="مواعيد اليوم" value={todayAppts} sub="موعد محجوز" color="#6699FF" />
      </div>

      {/* Recent Orders */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: G.gold }}>آخر الطلبات</h3>
          {data.orders.slice(0,4).map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.customer}</div>
                <div style={{ fontSize: 12, color: G.muted }}>{o.product}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, color: G.gold, fontWeight: 700 }}>{o.total} ج</div>
                <OrderBadge status={o.status} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: G.gold }}>أقرب المواعيد</h3>
          {data.appointments.slice(0,4).map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.customer}</div>
                <div style={{ fontSize: 12, color: G.muted }}>{a.type} — {a.time}</div>
              </div>
              <div style={{ fontSize: 12, color: G.goldLight }}>{a.date}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ---- PRODUCTS ----
function OrderBadge({ status }) {
  const map = { "جاري": "gold", "جاهز": "green", "تسليم": "blue", "ملغي": "red", "مؤكد": "green", "انتظار": "gray" };
  return <Badge color={map[status] || "gray"}>{status}</Badge>;
}

function Products({ data, setData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");

  const cats = ["الكل", ...new Set(data.products.map(p => p.category))];
  const filtered = data.products.filter(p =>
    (filter === "الكل" || p.category === filter) &&
    (p.name.includes(search) || p.category.includes(search))
  );

  const openAdd = () => { setForm({ name:"", category:"بدل رجالي", price:"", stock:"", description:"", sizes:["50"] }); setModal("add"); };
  const openEdit = (p) => { setForm({...p, sizes: p.sizes||[]}); setModal("edit"); };

  const save = () => {
    if (!form.name || !form.price) return alert("اسم السعر مطلوبين");
    if (modal === "add") {
      setData(d => ({ ...d, products: [...d.products, { ...form, id: uid(), price: +form.price, stock: +form.stock, image: "👔" }] }));
    } else {
      setData(d => ({ ...d, products: d.products.map(p => p.id === form.id ? { ...form, price: +form.price, stock: +form.stock } : p) }));
    }
    setModal(null);
  };

  const del = (id) => { if (confirm("تأكيد حذف المنتج؟")) setData(d => ({ ...d, products: d.products.filter(p => p.id !== id) })); };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: G.gold }}>👔 المنتجات والكتالوج</h2>
        <GoldBtn onClick={openAdd}>+ إضافة منتج</GoldBtn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="🔍 ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? G.gold : "transparent", color: filter === c ? G.black : G.muted,
            border: `1px solid ${filter === c ? G.gold : G.border}`, borderRadius: 20, padding: "6px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Cairo"
          }}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
        {filtered.map(p => (
          <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
            {p.stock <= 3 && <div style={{ position:"absolute", top:12, left:12 }}><Badge color="red">مخزون منخفض</Badge></div>}
            <div style={{ fontSize: 60, textAlign: "center", background: "#1A1A1A", borderRadius: 12, padding: "20px 0" }}>{p.image}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>{p.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {(p.sizes||[]).map(s => <span key={s} style={{ background: "#222", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>{s}</span>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: G.gold }}>{p.price.toLocaleString()} ج</span>
                <span style={{ fontSize: 12, color: p.stock <= 3 ? "#FF6666" : "#66BB66" }}>المخزون: {p.stock}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <GoldBtn size="sm" onClick={() => openEdit(p)} style={{ flex: 1 }}>✏️ تعديل</GoldBtn>
              <GoldBtn size="sm" variant="danger" onClick={() => del(p.id)}>🗑️</GoldBtn>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === "add" ? "إضافة منتج جديد" : "تعديل المنتج"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>اسم المنتج</label>
              <input value={form.name||""} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="اسم البدلة..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>التصنيف</label>
                <select value={form.category||""} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  <option>بدل رجالي</option><option>بدل عريس</option><option>سموكن</option><option>إكسسوارات</option>
                </select>
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>السعر (ج)</label>
                <input type="number" value={form.price||""} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="0" />
              </div>
            </div>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الكمية في المخزون</label>
              <input type="number" value={form.stock||""} onChange={e => setForm(f => ({...f, stock: e.target.value}))} placeholder="0" />
            </div>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الوصف</label>
              <textarea rows={2} value={form.description||""} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="وصف المنتج..." />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GoldBtn variant="ghost" onClick={() => setModal(null)}>إلغاء</GoldBtn>
              <GoldBtn onClick={save}>💾 حفظ</GoldBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- ORDERS ----
function Orders({ data, setData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filterStatus, setFilterStatus] = useState("الكل");

  const statuses = ["الكل", "جاري", "جاهز", "تسليم", "ملغي"];
  const filtered = data.orders.filter(o => filterStatus === "الكل" || o.status === filterStatus);

  const openAdd = () => { setForm({ customer:"", phone:"", product:"", size:"50", status:"جاري", total:"", notes:"", date: new Date().toISOString().slice(0,10) }); setModal("add"); };
  const openEdit = o => { setForm({...o}); setModal("edit"); };

  const save = () => {
    if (!form.customer || !form.product) return alert("اسم العميل والمنتج مطلوبين");
    if (modal === "add") {
      setData(d => ({ ...d, orders: [{ ...form, id: uid(), total: +form.total }, ...d.orders] }));
    } else {
      setData(d => ({ ...d, orders: d.orders.map(o => o.id === form.id ? { ...form, total: +form.total } : o) }));
    }
    setModal(null);
  };

  const del = id => { if (confirm("حذف الطلب؟")) setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) })); };

  const updateStatus = (id, status) => setData(d => ({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, status } : o) }));

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: G.gold }}>🛍️ طلبات العملاء</h2>
        <GoldBtn onClick={openAdd}>+ طلب جديد</GoldBtn>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            background: filterStatus === s ? G.gold : "transparent", color: filterStatus === s ? G.black : G.muted,
            border: `1px solid ${filterStatus === s ? G.gold : G.border}`, borderRadius: 20, padding: "6px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Cairo"
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(o => (
          <Card key={o.id} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{o.customer}</span>
                <OrderBadge status={o.status} />
              </div>
              <div style={{ fontSize: 13, color: G.muted }}>📞 {o.phone}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>👔 {o.product} — مقاس {o.size}</div>
              {o.notes && <div style={{ fontSize: 12, color: G.goldDark, marginTop: 4 }}>📝 {o.notes}</div>}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: G.gold }}>{o.total?.toLocaleString()} ج</div>
              <div style={{ fontSize: 12, color: G.muted }}>{o.date}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["جاري","جاهز","تسليم"].filter(s => s !== o.status).map(s => (
                <GoldBtn key={s} size="sm" variant="ghost" onClick={() => updateStatus(o.id, s)}>→ {s}</GoldBtn>
              ))}
              <GoldBtn size="sm" onClick={() => openEdit(o)}>✏️</GoldBtn>
              <GoldBtn size="sm" variant="danger" onClick={() => del(o.id)}>🗑️</GoldBtn>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "طلب جديد" : "تعديل الطلب"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>اسم العميل</label>
                <input value={form.customer||""} onChange={e => setForm(f => ({...f, customer: e.target.value}))} placeholder="الاسم" />
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>رقم الهاتف</label>
                <input value={form.phone||""} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="010..." />
              </div>
            </div>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>المنتج</label>
              <select value={form.product||""} onChange={e => setForm(f => ({...f, product: e.target.value}))}>
                <option value="">اختر منتج</option>
                {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>المقاس</label>
                <input value={form.size||""} onChange={e => setForm(f => ({...f, size: e.target.value}))} placeholder="50" />
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الإجمالي (ج)</label>
                <input type="number" value={form.total||""} onChange={e => setForm(f => ({...f, total: e.target.value}))} placeholder="0" />
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الحالة</label>
                <select value={form.status||"جاري"} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option>جاري</option><option>جاهز</option><option>تسليم</option><option>ملغي</option>
                </select>
              </div>
            </div>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>ملاحظات</label>
              <textarea rows={2} value={form.notes||""} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="أي ملاحظات..." />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GoldBtn variant="ghost" onClick={() => setModal(null)}>إلغاء</GoldBtn>
              <GoldBtn onClick={save}>💾 حفظ</GoldBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- APPOINTMENTS ----
function Appointments({ data, setData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...data.appointments].sort((a, b) => a.date.localeCompare(b.date));

  const openAdd = () => { setForm({ customer:"", phone:"", date: today, time:"10:00", type:"قياس", notes:"", status:"مؤكد" }); setModal(true); };

  const save = () => {
    if (!form.customer || !form.date) return alert("اسم العميل والتاريخ مطلوبين");
    if (modal === "edit") {
      setData(d => ({ ...d, appointments: d.appointments.map(a => a.id === form.id ? form : a) }));
    } else {
      setData(d => ({ ...d, appointments: [...d.appointments, { ...form, id: uid() }] }));
    }
    setModal(null);
  };

  const del = id => { if (confirm("حذف الموعد؟")) setData(d => ({ ...d, appointments: d.appointments.filter(a => a.id !== id) })); };

  // Group by date
  const grouped = upcoming.reduce((acc, a) => { (acc[a.date] = acc[a.date] || []).push(a); return acc; }, {});

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: G.gold }}>📅 المواعيد</h2>
        <GoldBtn onClick={openAdd}>+ موعد جديد</GoldBtn>
      </div>

      {Object.entries(grouped).map(([date, appts]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ height: 1, flex: 1, background: G.border }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: date === today ? G.gold : G.muted, padding: "4px 14px", background: date === today ? "#C9A84C22" : "#222", borderRadius: 20, border: `1px solid ${date === today ? G.gold : G.border}` }}>
              {date === today ? "📍 اليوم" : ""} {date}
            </span>
            <div style={{ height: 1, flex: 1, background: G.border }} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {appts.map(a => (
              <Card key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontSize: 32, background: "#1A1A1A", padding: "10px 14px", borderRadius: 10, minWidth: 60, textAlign: "center" }}>
                  {a.type === "قياس" ? "📏" : a.type === "تسليم" ? "📦" : "💬"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{a.customer}</span>
                    <Badge color={a.status === "مؤكد" ? "green" : "gray"}>{a.status}</Badge>
                    <Badge color="gold">{a.type}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: G.muted }}>📞 {a.phone} &nbsp;•&nbsp; 🕐 {a.time}</div>
                  {a.notes && <div style={{ fontSize: 12, color: G.goldDark, marginTop: 4 }}>📝 {a.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <GoldBtn size="sm" onClick={() => { setForm({...a}); setModal("edit"); }}>✏️</GoldBtn>
                  <GoldBtn size="sm" variant="danger" onClick={() => del(a.id)}>🗑️</GoldBtn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title="موعد جديد" onClose={() => setModal(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>اسم العميل</label>
                <input value={form.customer||""} onChange={e => setForm(f => ({...f, customer: e.target.value}))} placeholder="الاسم" />
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>رقم الهاتف</label>
                <input value={form.phone||""} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="010..." />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>التاريخ</label>
                <input type="date" value={form.date||""} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الوقت</label>
                <input type="time" value={form.time||""} onChange={e => setForm(f => ({...f, time: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>نوع الموعد</label>
                <select value={form.type||"قياس"} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  <option>قياس</option><option>تسليم</option><option>استفسار</option><option>تعديل</option>
                </select>
              </div>
              <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>الحالة</label>
                <select value={form.status||"مؤكد"} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option>مؤكد</option><option>انتظار</option><option>ملغي</option>
                </select>
              </div>
            </div>
            <div><label style={{ fontSize: 13, color: G.muted, display: "block", marginBottom: 6 }}>ملاحظات</label>
              <textarea rows={2} value={form.notes||""} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="أي ملاحظات..." />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GoldBtn variant="ghost" onClick={() => setModal(null)}>إلغاء</GoldBtn>
              <GoldBtn onClick={save}>💾 حفظ</GoldBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- INVENTORY ----
function Inventory({ data, setData }) {
  const lowStock = data.products.filter(p => p.stock <= 3);
  const totalValue = data.products.reduce((s, p) => s + p.price * p.stock, 0);

  const updateStock = (id, delta) => {
    setData(d => ({ ...d, products: d.products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p) }));
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: G.gold }}>📦 إدارة المخزون</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="💎" label="قيمة المخزون" value={`${totalValue.toLocaleString()} ج`} />
        <StatCard icon="📊" label="إجمالي الأصناف" value={data.products.length} />
        <StatCard icon="⚠️" label="مخزون منخفض" value={lowStock.length} color="#FF6666" />
        <StatCard icon="✅" label="مخزون كافي" value={data.products.filter(p => p.stock > 3).length} color="#66BB66" />
      </div>

      {lowStock.length > 0 && (
        <Card style={{ marginBottom: 20, border: "1px solid #5A2A2A", background: "#1A0A0A" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6666", marginBottom: 10 }}>⚠️ تحذير: منتجات تحتاج إعادة تخزين</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lowStock.map(p => <Badge key={p.id} color="red">{p.name} ({p.stock} قطعة)</Badge>)}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {data.products.map(p => (
          <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 36 }}>{p.image}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: G.muted }}>{p.category} • {p.price.toLocaleString()} ج</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: G.muted }}>الكمية:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => updateStock(p.id, -1)} style={{ background: "#2A1A1A", border: "1px solid #5A2A2A", color: "#FF6666", borderRadius: 6, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>−</button>
                <span style={{ fontSize: 18, fontWeight: 800, color: p.stock <= 3 ? "#FF6666" : G.gold, minWidth: 40, textAlign: "center" }}>{p.stock}</span>
                <button onClick={() => updateStock(p.id, +1)} style={{ background: "#1A2A1A", border: "1px solid #2A5A2A", color: "#66BB66", borderRadius: 6, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
              <div style={{ fontSize: 12, color: G.muted }}>قيمة: {(p.price * p.stock).toLocaleString()} ج</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const PAGES = [
  { id: "dashboard", label: "الرئيسية", icon: "🏠" },
  { id: "products", label: "المنتجات", icon: "👔" },
  { id: "orders", label: "الطلبات", icon: "🛍️" },
  { id: "appointments", label: "المواعيد", icon: "📅" },
  { id: "inventory", label: "المخزون", icon: "📦" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(mockDB);

  const pendingOrders = data.orders.filter(o => o.status === "جاري").length;

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: G.black }}>

        {/* SIDEBAR */}
        <aside style={{ width: 240, background: G.surface, borderLeft: `1px solid ${G.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "24px 20px", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>🎩</div>
            <div className="gold-shimmer" style={{ fontSize: 18, fontWeight: 900, textAlign: "center", fontFamily: "Amiri", letterSpacing: 1 }}>سيف والعريس</div>
            <div style={{ fontSize: 11, color: G.muted, textAlign: "center", marginTop: 4 }}>إدارة أبو سيف</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {PAGES.map(p => (
              <button key={p.id} onClick={() => setPage(p.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "none",
                background: page === p.id ? "#C9A84C22" : "transparent",
                color: page === p.id ? G.gold : G.muted,
                fontFamily: "Cairo", fontSize: 14, fontWeight: page === p.id ? 700 : 400, cursor: "pointer",
                borderRight: page === p.id ? `3px solid ${G.gold}` : "3px solid transparent",
                transition: "all 0.2s", width: "100%", textAlign: "right",
              }}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
                {p.id === "orders" && pendingOrders > 0 && (
                  <span style={{ marginRight: "auto", background: G.gold, color: G.black, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{pendingOrders}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: 16, borderTop: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 11, color: G.muted, textAlign: "center" }}>
              01009331804<br />01229723129
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {page === "dashboard" && <Dashboard data={data} />}
          {page === "products" && <Products data={data} setData={setData} />}
          {page === "orders" && <Orders data={data} setData={setData} />}
          {page === "appointments" && <Appointments data={data} setData={setData} />}
          {page === "inventory" && <Inventory data={data} setData={setData} />}
        </main>
      </div>
    </>
  );
}
