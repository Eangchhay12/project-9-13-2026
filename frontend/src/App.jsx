import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  Check,
  DollarSign,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8000";
const qrImageUrl = (value) => value && !value.startsWith("data:") && !value.startsWith("http") ? `${API_ORIGIN}/storage/${value}` : value;
const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("admin_token");
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `Request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
};
const dataUrlToFile = async (dataUrl, name) => {
  const response = await fetch(dataUrl);
  return new File([await response.blob()], name, { type: response.headers.get("content-type") || "image/png" });
};
const today = new Date().toISOString().slice(0, 10);
const addDays = (date, days) => {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
};
const defaultPayDate = addDays(today, 30);
const formatDate = (date) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB") : "-";
const daysWorked = (joinedAt) =>
  joinedAt
    ? Math.max(
        0,
        Math.floor(
          (new Date(`${today}T00:00:00`) - new Date(`${joinedAt}T00:00:00`)) /
            86400000,
        ),
      )
    : 0;
const getPaymentStatus = (user) => {
  if (user.paymentStatus === "Paid") return "Paid";
  if (today < user.payDate) return "Upcoming";
  if (today === user.payDate) return "Due";
  return "Upcoming";
};
const demoUsers = [
  {
    id: 1,
    name: "Sokha Chan",
    email: "sokha@example.com",
    gender: "Male",
    role: "Administrator",
    salary: 1800,
    payDate: "2026-10-10",
    joinedAt: "2026-09-10",
    paymentStatus: "Pending",
    status: "Active",
  },
  {
    id: 2,
    name: "Dara Lim",
    email: "dara@example.com",
    gender: "Female",
    role: "Editor",
    salary: 1450,
    payDate: "2026-10-10",
    joinedAt: "2026-09-10",
    paymentStatus: "Pending",
    status: "Active",
  },
  {
    id: 3,
    name: "Mony Vuth",
    email: "mony@example.com",
    gender: "Male",
    role: "Viewer",
    salary: 1100,
    payDate: "2026-10-10",
    joinedAt: "2026-09-10",
    paymentStatus: "Pending",
    status: "Pending",
  },
];
const demoPayroll = [
  {
    id: 1,
    employee: "Sokha Chan",
    department: "Administration",
    baseSalary: 1800,
    allowance: 250,
    deduction: 50,
    status: "Paid",
  },
  {
    id: 2,
    employee: "Dara Lim",
    department: "Engineering",
    baseSalary: 1450,
    allowance: 180,
    deduction: 30,
    status: "Pending",
  },
  {
    id: 3,
    employee: "Mony Vuth",
    department: "Operations",
    baseSalary: 1100,
    allowance: 120,
    deduction: 20,
    status: "Pending",
  },
];

function App() {
  const [session, setSession] = useState(() =>
    localStorage.getItem("admin_session"),
  );
  const [profile, setProfile] = useState(() =>
    JSON.parse(
      localStorage.getItem("admin_profile") ||
        JSON.stringify({
          name: "Sokha Chan",
          email: "sokha@example.com",
          role: "Administrator",
        }),
    ),
  );
  const [page, setPage] = useState("overview");
  const [users, setUsers] = useState(() => {
    const storedUsers = JSON.parse(
      localStorage.getItem("admin_users") || "null",
    );
    return (storedUsers?.length ? storedUsers : demoUsers).map((user) => ({
      gender: "Other",
      salary: 0,
      photo: "",
      qrPhoto: "",
      joinedAt: today,
      payDate: addDays(user.joinedAt || today, 30),
      paymentStatus: "Pending",
      ...user,
    }));
  });
  const [payroll, setPayroll] = useState(() =>
    JSON.parse(
      localStorage.getItem("admin_payroll") || JSON.stringify(demoPayroll),
    ),
  );
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [profileModal, setProfileModal] = useState(false);
  const [payrollModal, setPayrollModal] = useState(null);
  const [paymentUser, setPaymentUser] = useState(null);
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.name} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [users, query],
  );
  useEffect(
    () => localStorage.setItem("admin_users", JSON.stringify(users)),
    [users],
  );
  useEffect(
    () => localStorage.setItem("admin_profile", JSON.stringify(profile)),
    [profile],
  );
  useEffect(
    () => localStorage.setItem("admin_payroll", JSON.stringify(payroll)),
    [payroll],
  );
  useEffect(() => {
    if (!session || session === "demo" || !localStorage.getItem("admin_token")) return;
    apiRequest("/users")
      .then((result) => setUsers((result.data || []).map((user) => ({ ...user, qrPhoto: qrImageUrl(user.qr_photo || ""), joinedAt: user.joined_at, payDate: user.pay_date, paymentStatus: user.payment_status || "Pending" }))))
      .catch(() => setNotice("Could not load users from API; showing local data."));
  }, [session]);
  if (!session)
    return (
      <Login
        onLogin={(result) => {
          localStorage.setItem("admin_session", result?.token || "demo");
          if (result?.token) localStorage.setItem("admin_token", result.token);
          setSession(result?.token || "demo");
        }}
      />
    );

  const addUser = async (data) => {
    const joinedAt = data.joinedAt || today;
    setUsers((current) => [
      {
        ...data,
        qrPhoto: data.qrPhoto || data.photo || "",
        id: Date.now(),
        joined: joinedAt,
        joinedAt,
        payDate: data.payDate || addDays(joinedAt, 30),
        paymentStatus: "Pending",
        salary: Number(data.salary) || 0,
      },
      ...current,
    ]);
    setModal(null);
    setNotice("User created successfully");
    if (localStorage.getItem("admin_token")) {
      try {
        const result = await apiRequest("/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, password: "password123" }) });
        if (data.qrPhoto) { const formData = new FormData(); formData.append("qr_photo", await dataUrlToFile(data.qrPhoto, "payment-qr.png")); await apiRequest(`/users/${result.id}/qr-photo`, { method: "POST", body: formData }); }
      } catch (error) { setNotice(error.message); }
    }
  };
  const updateUser = async (data) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === data.id
          ? {
              ...data,
              qrPhoto: data.qrPhoto || data.photo || user.qrPhoto || "",
            }
          : user,
      ),
    );
    setModal(null);
    setNotice("User updated successfully");
    if (localStorage.getItem("admin_token")) {
      try {
        await apiRequest(`/users/${data.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (data.qrPhoto?.startsWith("data:")) { const formData = new FormData(); formData.append("qr_photo", await dataUrlToFile(data.qrPhoto, "payment-qr.png")); await apiRequest(`/users/${data.id}/qr-photo`, { method: "POST", body: formData }); }
      } catch (error) { setNotice(error.message); }
    }
  };
  const removeUser = (id) => {
    setUsers((current) => current.filter((user) => user.id !== id));
    setNotice("User removed");
    if (localStorage.getItem("admin_token")) apiRequest(`/users/${id}`, { method: "DELETE" }).catch((error) => setNotice(error.message));
  };
  const logout = () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("admin_token");
    setSession(null);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Boxes size={20} />
          </span>
          <span>
            {profile.name.split(" ")[0]}
            <span className="brand-dot">.</span>
            {profile.role === "Administrator" ? "Admin" : profile.role}
          </span>
        </div>
        <p className="eyebrow">Workspace</p>
        <nav>
          {[
            ["overview", LayoutDashboard, "Overview"],
            ["users", Users, "Users"],
            ["salary", DollarSign, "Salary"],
            ["security", ShieldCheck, "Security"],
          ].map(([key, Icon, label]) => (
            <button
              className={page === key ? "nav-item active" : "nav-item"}
              onClick={() => setPage(key)}
              key={key}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status">
            <span className="pulse" /> API connected
            <br />
            <small>{API_URL.replace("http://", "")}</small>
          </div>
          <button className="nav-item" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu">
            <Menu size={20} />
          </button>
          <div>
            <p className="kicker">Monday, September 11, 2026</p>
            <h1>
              {page === "overview"
                ? "Good morning, Admin"
                : page === "users"
                  ? "User directory"
                  : page === "salary"
                    ? "Salary management"
                    : "Security center"}
            </h1>
          </div>
          <button
            className="profile"
            onClick={() => setProfileModal(true)}
            title="Edit profile"
          >
            <span className="avatar">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <strong>{profile.name}</strong>
              <small>{profile.role}</small>
            </div>
          </button>
        </header>
        {notice && (
          <div className="notice">
            <Check size={16} />
            {notice}
            <button onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {page === "overview" && (
          <Overview users={users} onUsers={() => setPage("users")} />
        )}
        {page === "users" && (
          <UsersPage
            users={filteredUsers}
            query={query}
            setQuery={setQuery}
            onAdd={() => setModal({ type: "add" })}
            onEdit={(user) => setModal({ type: "edit", user })}
            onDelete={removeUser}
          />
        )}
        {page === "salary" && (
          <SalaryPage
            users={users}
            onEdit={(user) => setModal({ type: "edit", user })}
            onPay={(user) => setPaymentUser(user)}
          />
        )}
        {page === "security" && <Security />}
      </main>
      {modal && (
        <UserModal
          modal={modal}
          onClose={() => setModal(null)}
          onAdd={addUser}
          onUpdate={updateUser}
        />
      )}
      {payrollModal && (
        <PayrollModal
          record={payrollModal}
          onClose={() => setPayrollModal(null)}
          onSave={(record) => {
            setPayroll((current) =>
              current.map((item) => (item.id === record.id ? record : item)),
            );
            setPayrollModal(null);
            setNotice("Salary updated successfully");
          }}
        />
      )}
      {paymentUser && (
        <PaymentModal
          user={paymentUser}
          onClose={() => setPaymentUser(null)}
          onPaid={async () => {
            try {
              if (localStorage.getItem("admin_token")) {
                const payment = await apiRequest(`/users/${paymentUser.id}/salary-payments`, { method: "POST" });
                await apiRequest(`/salary-payments/${payment.id}/confirm`, { method: "POST" });
              }
              setUsers((current) => current.map((user) => user.id === paymentUser.id ? { ...user, paymentStatus: "Pending", payDate: addDays(user.payDate, 30) } : user));
              setPaymentUser(null);
              setNotice(`${paymentUser.name} marked as Paid`);
            } catch (error) { setNotice(error.message); }
          }}
        />
      )}
      {profileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileModal(false)}
          onSave={(data) => {
            const { password, passwordConfirmation, ...nextProfile } = data;
            if (password) localStorage.setItem("admin_password", password);
            setProfile(nextProfile);
            setProfileModal(false);
            setNotice("Profile updated successfully");
          }}
        />
      )}
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState(
    () =>
      JSON.parse(
        localStorage.getItem("admin_profile") ||
          '{"email":"sokha@example.com"}',
      ).email,
  );
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await apiRequest("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      onLogin(result);
      return;
    } catch {
      // Keep demo login available when the API is unavailable.
    }
    const savedProfile = JSON.parse(
      localStorage.getItem("admin_profile") || '{"email":"sokha@example.com"}',
    );
    const savedPassword = localStorage.getItem("admin_password") || "password";
    if (email !== savedProfile.email || password !== savedPassword)
      return setError("Email or password is incorrect.");
    onLogin();
  };
  return (
    <div className="login-page">
      <div className="login-art">
        <div className="art-grid" />
        <span className="art-label">NEXA / ADMIN OS</span>
        <div className="art-copy">
          <p>
            People, permissions,
            <br />
            <em>in one clear view.</em>
          </p>
          <span>Minimal operations for teams that move with intention.</span>
        </div>
        <div className="art-orbit">
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className="login-panel">
        <div className="brand dark">
          <span className="brand-mark">
            <Boxes size={20} />
          </span>
          <span>
            nexa<span className="brand-dot">.</span>admin
          </span>
        </div>
        <div className="login-heading">
          <p className="kicker">Welcome back</p>
          <h1>
            Sign in to your
            <br />
            <em>workspace.</em>
          </h1>
          <p>Access your dashboard and keep your team moving.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <div className="input-icon">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <KeyRound size={16} />
            </div>
          </label>
          <div className="form-row">
            <label className="check">
              <input type="checkbox" defaultChecked /> Remember me
            </label>
            <a href="#reset">Forgot password?</a>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="primary wide" type="submit">
            Continue <ArrowRight size={17} />
          </button>
        </form>
        <p className="login-foot">
          Demo mode · Authentication API ready at{" "}
          <strong>localhost:8000</strong>
        </p>
      </div>
    </div>
  );
}

function Overview({ users, onUsers }) {
  const active = users.filter((user) => user.status === "Active").length;
  return (
    <div className="content">
      <section className="hero-card">
        <div>
          <p className="kicker light">Command center</p>
          <h2>
            Everything your team
            <br />
            <em>needs to move forward.</em>
          </h2>
          <p className="hero-copy">
            A focused view of users, access, and daily activity.
          </p>
        </div>
        <div className="hero-stat">
          <span>System status</span>
          <strong>
            <i /> All systems operational
          </strong>
          <small>Updated just now</small>
        </div>
      </section>
      <div className="metrics">
        <Metric
          icon={Users}
          label="Total users"
          value={users.length}
          change="+12.5%"
        />
        <Metric
          icon={Activity}
          label="Active today"
          value={active}
          change="+8.2%"
        />
        <Metric
          icon={ShieldCheck}
          label="Security score"
          value="98%"
          change="Excellent"
        />
        <Metric
          icon={Package}
          label="API requests"
          value="24.8k"
          change="+18.4%"
        />
      </div>
      <section className="section-head">
        <div>
          <p className="kicker">Workspace activity</p>
          <h2>Recent users</h2>
        </div>
        <button className="text-button" onClick={onUsers}>
          View all users <ArrowRight size={16} />
        </button>
      </section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 3).map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Metric({ icon: Icon, label, value, change }) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </div>
  );
}
function UsersPage({ users, query, setQuery, onAdd, onEdit, onDelete }) {
  return (
    <div className="content">
      <div className="section-head page-head">
        <div>
          <p className="kicker">Directory</p>
          <h2>Manage users</h2>
          <p className="muted">Create, update, and control workspace access.</p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={17} /> Add user
        </button>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
          />
        </div>
        <span className="result-count">{users.length} users</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee name</th>
              <th>Gender</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                actions
                onEdit={() => onEdit(user)}
                onDelete={() => onDelete(user.id)}
              />
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="empty">No users match your search.</div>
        )}
      </div>
    </div>
  );
}
function SalaryPage({ users, onEdit, onPay }) {
  const total = users.reduce((sum, user) => sum + Number(user.salary || 0), 0);
  const dueUsers = users.filter((user) => getPaymentStatus(user) === "Due");
  return (
    <div className="content">
      <div className="section-head page-head">
        <div>
          <p className="kicker">Employee records</p>
          <h2>Manage salary</h2>
          <p className="muted">
            30-day salary cycles, working days, earned salary, and QR payment.
          </p>
        </div>
        <div className="payroll-total">
          <span>Total monthly salary</span>
          <strong>${total.toLocaleString()}</strong>
        </div>
      </div>
      {dueUsers.length > 0 && (
        <div className="payment-due">
          <QrCode size={20} />
          <div>
            <strong>Payment Due today</strong>
            <span>
              {dueUsers.length} employee{dueUsers.length > 1 ? "s are" : " is"}{" "}
              ready for payment.
            </span>
          </div>
        </div>
      )}
      <div className="metrics">
        <Metric
          icon={Users}
          label="Employees"
          value={users.length}
          change="Current records"
        />
        <Metric
          icon={DollarSign}
          label="Monthly salary"
          value={`$${total.toLocaleString()}`}
          change="Total base salary"
        />
        <Metric
          icon={Activity}
          label="Average salary"
          value={`$${users.length ? Math.round(total / users.length).toLocaleString() : 0}`}
          change="Per employee"
        />
        <Metric
          icon={Check}
          label="Due today"
          value={dueUsers.length}
          change="QR available only today"
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Gender</th>
              <th>Role</th>
              <th>Monthly salary</th>
              <th>Daily rate</th>
              <th>Worked days</th>
              <th>Earned salary</th>
              <th>Salary period / pay date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const dailyRate = Number(user.salary || 0) / 30;
              const periodStart = addDays(user.payDate, -30);
              const worked = Math.min(30, Math.max(0, daysWorked(periodStart)));
              const earnedSalary = dailyRate * worked;
              const status = getPaymentStatus(user);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      {user.photo ? (
                        <img
                          className="avatar small photo"
                          src={user.photo}
                          alt=""
                        />
                      ) : (
                        <span className="avatar small">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                      )}
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td className="muted">{user.gender || "Other"}</td>
                  <td>
                    <span className="role">{user.role}</span>
                  </td>
                  <td>
                    <strong>
                      ${Number(user.salary || 0).toLocaleString()}
                    </strong>
                  </td>
                  <td className="muted">${dailyRate.toFixed(2)}</td>
                  <td className="muted">{worked} / 30</td>
                  <td><strong>${earnedSalary.toFixed(2)}</strong></td>
                  <td className="muted">{formatDate(periodStart)} → {formatDate(user.payDate)}</td>
                  <td>
                    {status === "Due" ? (
                      <button
                        className="pay-button"
                        onClick={() => onPay(user)}
                      >
                        <QrCode size={14} /> Pay
                      </button>
                    ) : <span className={`badge ${status.toLowerCase()}`}><i />{status}</span>}
                  </td>
                  <td>
                    <button
                      className="icon-action"
                      title="Edit salary and pay date"
                      onClick={() => onEdit(user)}
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function PaymentModal({ user, onClose, onPaid }) {
  const amount = Number(user.salary || 0).toFixed(2);
  const periodStart = addDays(user.payDate, -30);
  const dailyRate = Number(user.salary || 0) / 30;
  const workingDays = Math.min(30, Math.max(0, daysWorked(periodStart)));
  const earnedSalary = dailyRate * workingDays;
  const qrData = `NEXA|salary|employee:${user.id}|amount:${amount}|pay-date:${user.payDate}|updated:${Date.now()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}`;
  return (
    <div className="modal-backdrop">
      <div className="modal payment-modal">
        <div className="modal-head">
          <div>
            <p className="kicker">Payment Due</p>
            <h2>{user.name}</h2>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="payment-summary">
          <span>Salary period: {formatDate(periodStart)} → {formatDate(user.payDate)}</span>
          <span>Working days: {workingDays} / 30</span>
          <span>Daily salary: ${dailyRate.toFixed(2)}</span>
          <strong>Amount to pay: ${earnedSalary.toFixed(2)}</strong>
        </div>
        <div className="qr-box">
          <img
            src={user.qrPhoto || qrUrl}
            alt={`Latest salary payment QR for ${user.name}`}
          />
          <strong>${amount}</strong>
          <span>Pay date: {formatDate(user.payDate)}</span>
          <small>
            {user.qrPhoto
              ? "Employee QR image"
              : "Demo QR generated automatically"}
          </small>
        </div>
        <p className="muted payment-note">
          This is the latest QR for this employee and payment date. After
          confirmation, this QR will be closed.
        </p>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={onPaid}>
            <Check size={16} /> Confirm payment
          </button>
        </div>
      </div>
    </div>
  );
}
function UserRow({ user, actions, onEdit, onDelete }) {
  return (
    <tr>
      <td>
        <div className="user-cell">
          {user.photo ? (
            <img className="avatar small photo" src={user.photo} alt="" />
          ) : (
            <span className="avatar small">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
          )}
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      </td>
      <td className="muted">{user.gender || "Other"}</td>
      <td>
        <span className="role">{user.role}</span>
      </td>
      <td>
        <strong>${Number(user.salary || 0).toLocaleString()}</strong>
      </td>
      <td>
        <span className={`badge ${user.status.toLowerCase()}`}>
          <i />
          {user.status}
        </span>
      </td>
      <td className="muted">{user.joinedAt || user.joined || "Today"}</td>
      <td>
        {actions && (
          <div className="actions">
            <button title="Edit user" onClick={onEdit}>
              <Pencil size={15} />
            </button>
            <button title="Delete user" onClick={onDelete}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
function UserModal({ modal, onClose, onAdd, onUpdate }) {
  const existing = modal.user || {
    name: "",
    email: "",
    gender: "Other",
    role: "Editor",
    salary: 0,
    photo: "",
    qrPhoto: "",
    joinedAt: today,
    payDate: addDays(today, 30),
    status: "Active",
  };
  const [form, setForm] = useState({
    gender: "Other",
    salary: 0,
    photo: "",
    qrPhoto: "",
    joinedAt: today,
    payDate: addDays(today, 30),
    ...existing,
  });
  const [formError, setFormError] = useState("");
  const save = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    modal.type === "add"
      ? onAdd(form)
      : onUpdate({ ...form, salary: Number(form.salary) || 0 });
  };
  const photo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result });
    reader.readAsDataURL(file);
  };
  const qrPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Payment QR must be an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError("Payment QR must be 2MB or smaller.");
      return;
    }
    setFormError("");
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, qrPhoto: reader.result }));
    reader.readAsDataURL(file);
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={save}>
        <div className="modal-head">
          <div>
            <p className="kicker">
              {modal.type === "add" ? "New employee" : "Employee record"}
            </p>
            <h2>{modal.type === "add" ? "Add user" : "Edit user"}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label>
          Employee photo
          <input type="file" accept="image/*" onChange={photo} />
        </label>
        <label>
          Payment QR Code
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={qrPhoto} />
          {form.qrPhoto && <img className="qr-preview" src={form.qrPhoto} alt="Payment QR preview" />}
          <small className="muted">Image only, maximum 2MB.</small>
          {formError && <small className="error">{formError}</small>}
        </label>
        <label>
          Employee name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Alex Morgan"
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="alex@example.com"
          />
        </label>
        <div className="form-grid">
          <label>
            Gender
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option>Administrator</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Monthly salary
            <input
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Joined date
            <input
              type="date"
              value={form.joinedAt}
              onChange={(e) => setForm({ ...form, joinedAt: e.target.value, payDate: addDays(e.target.value, 30) })}
            />
          </label>
          <label>
            Salary pay date
            <input
              type="date"
              value={form.payDate}
              onChange={(e) => setForm({ ...form, payDate: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            <Check size={16} /> Save user
          </button>
        </div>
      </form>
    </div>
  );
}
function PayrollPage({ payroll, onEdit, onPay }) {
  const total = payroll.reduce(
    (sum, record) =>
      sum + record.baseSalary + record.allowance - record.deduction,
    0,
  );
  return (
    <div className="content">
      <div className="section-head page-head">
        <div>
          <p className="kicker">People operations</p>
          <h2>Manage payroll</h2>
          <p className="muted">
            Review monthly salaries, allowances, deductions, and payment status.
          </p>
        </div>
        <div className="payroll-total">
          <span>Monthly net total</span>
          <strong>${total.toLocaleString()}</strong>
        </div>
      </div>
      <div className="metrics">
        <Metric
          icon={Users}
          label="Employees"
          value={payroll.length}
          change="Current month"
        />
        <Metric
          icon={DollarSign}
          label="Net payroll"
          value={`$${total.toLocaleString()}`}
          change="Before tax filing"
        />
        <Metric
          icon={Check}
          label="Paid"
          value={payroll.filter((record) => record.status === "Paid").length}
          change="Employees paid"
        />
        <Metric
          icon={Activity}
          label="Pending"
          value={payroll.filter((record) => record.status === "Pending").length}
          change="Needs action"
        />
      </div>
      <div className="toolbar">
        <div className="kicker">September 2026 payroll</div>
        <span className="result-count">All amounts in USD</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Base salary</th>
              <th>Allowance</th>
              <th>Deduction</th>
              <th>Net salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((record) => (
              <tr key={record.id}>
                <td>
                  <div className="user-cell">
                    <span className="avatar small">
                      {record.employee
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <strong>{record.employee}</strong>
                  </div>
                </td>
                <td className="muted">{record.department}</td>
                <td>${record.baseSalary.toLocaleString()}</td>
                <td className="money-positive">
                  +${record.allowance.toLocaleString()}
                </td>
                <td className="money-negative">
                  -${record.deduction.toLocaleString()}
                </td>
                <td>
                  <strong>
                    $
                    {(
                      record.baseSalary +
                      record.allowance -
                      record.deduction
                    ).toLocaleString()}
                  </strong>
                </td>
                <td>
                  <span className={`badge ${record.status.toLowerCase()}`}>
                    <i />
                    {record.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button title="Edit salary" onClick={() => onEdit(record)}>
                      <Pencil size={15} />
                    </button>
                    {record.status === "Pending" && (
                      <button
                        className="pay-button"
                        onClick={() => onPay(record.id)}
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function PayrollModal({ record, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const save = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      baseSalary: Number(form.baseSalary),
      allowance: Number(form.allowance),
      deduction: Number(form.deduction),
    });
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={save}>
        <div className="modal-head">
          <div>
            <p className="kicker">Salary record</p>
            <h2>Edit payroll</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label>
          Employee
          <input value={form.employee} disabled />
        </label>
        <label>
          Department
          <input
            value={form.department}
            onChange={(event) =>
              setForm({ ...form, department: event.target.value })
            }
          />
        </label>
        <div className="form-grid">
          <label>
            Base salary
            <input
              type="number"
              min="0"
              value={form.baseSalary}
              onChange={(event) =>
                setForm({ ...form, baseSalary: event.target.value })
              }
            />
          </label>
          <label>
            Allowance
            <input
              type="number"
              min="0"
              value={form.allowance}
              onChange={(event) =>
                setForm({ ...form, allowance: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Deduction
          <input
            type="number"
            min="0"
            value={form.deduction}
            onChange={(event) =>
              setForm({ ...form, deduction: event.target.value })
            }
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            <Check size={16} /> Save salary
          </button>
        </div>
      </form>
    </div>
  );
}
function ProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    ...profile,
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");
  const save = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim())
      return setError("Name and email are required.");
    if (form.password && form.password.length < 8)
      return setError("New password must be at least 8 characters.");
    if (form.password !== form.passwordConfirmation)
      return setError("Passwords do not match.");
    onSave(form);
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={save}>
        <div className="modal-head">
          <div>
            <p className="kicker">Account settings</p>
            <h2>Edit profile</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label>
          Full name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank to keep current password"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={form.passwordConfirmation}
            onChange={(e) =>
              setForm({ ...form, passwordConfirmation: e.target.value })
            }
          />
        </label>
        <label>
          Role
          <input value={form.role} disabled />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            <Check size={16} /> Save profile
          </button>
        </div>
      </form>
    </div>
  );
}
function Security() {
  return (
    <div className="content">
      <div className="section-head page-head">
        <div>
          <p className="kicker">Protection</p>
          <h2>Security center</h2>
          <p className="muted">
            Your workspace is configured for secure access.
          </p>
        </div>
      </div>
      <div className="security-grid">
        <div className="security-card">
          <ShieldCheck size={22} />
          <strong>Authentication</strong>
          <p>
            Token-based API authentication is enabled through Laravel Sanctum.
          </p>
          <span className="badge active">
            <i />
            Enabled
          </span>
        </div>
        <div className="security-card">
          <KeyRound size={22} />
          <strong>Password policy</strong>
          <p>
            Strong passwords and encrypted credentials protect every account.
          </p>
          <span className="badge active">
            <i />
            Healthy
          </span>
        </div>
        <div className="security-card">
          <Activity size={22} />
          <strong>Audit activity</strong>
          <p>API actions are logged for visibility across your workspace.</p>
          <span className="badge active">
            <i />
            Monitoring
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
