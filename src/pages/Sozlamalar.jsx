import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash, Phone, Loader2 } from "lucide-react";
import "./styles/Sozlamalar.css";

const roleOptions = [
  { id: 1, value: "KITCHEN", label: "Oshpaz" },
  { id: 2, value: "CASHIER", label: "Ofitsiant" },
  { id: 3, value: "CUSTOMER", label: "Boshqaruvchi" },
  { id: 4, value: "BIGADMIN", label: "Direktor" },
];

export default function Sozlamalar() {
  const [staff, setStaff] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    name: "",
    surname: "",
    username: "",
    phone: "",
    password: "",
    role: "KITCHEN",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("https://suddocs.uz/user", {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const users = response.data.map((user) => ({
          id: user.id,
          role: user.role || "KITCHEN",
          name: user.name || "",
          surname: user.surname || "",
          phone: user.phone || "",
          username: user.username || "",
          password: "",
        }));
        setStaff(users);
      } catch (err) {
        console.error("Xodimlarni yuklashda xatolik:", err.message, err.response?.data);
        setError("Xodimlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStaffSave = async () => {
    try {
      const staffData = {
        username: editingStaff.username,
        password: editingStaff.password,
        phone: editingStaff.phone,
        role: editingStaff.role,
      };
      await axios.put(`https://suddocs.uz/user/${editingStaff.id}`, staffData, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && { Authorization: `Bearer ${localStorage.getItem("token")}` }),
        },
      });
      setStaff((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...editingStaff, ...staffData } : s))
      );
      setEditingStaff(null);
    } catch (err) {
      console.error("Xodimni saqlashda xatolik:", err);
      alert("Xodimni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.username || !newStaff.password) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring (Ism, Telefon, Login, Parol).");
      return;
    }
    try {
      const staffData = {
        name: newStaff.name,
        surname: newStaff.surname,
        username: newStaff.username,
        phone: newStaff.phone,
        password: newStaff.password,
        role: newStaff.role,
      };
      const response = await axios.post("https://suddocs.uz/user", staffData, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && { Authorization: `Bearer ${localStorage.getItem("token")}` }),
        },
      });
      setStaff([...staff, { id: response.data.id, ...staffData }]);
      setNewStaff({ name: "", surname: "", username: "", phone: "", password: "", role: "KITCHEN" });
      setShowAddModal(false);
    } catch (err) {
      console.error("Yangi xodim qo'shishda xatolik:", err.response?.data || err.message);
      alert("Yangi xodim qo'shishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1 style={{color: "#ffffff"}} className="app-title">Sozlamalar</h1>
      </header>
      <section className="add-employee-section">
        <h2 className="section-title">Xodimlar</h2>
        {loading ? (
          <div className="spinner">
          </div>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <>
            <button
              className="btn btn-primary btn-with-icon"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              Yangi Xodim Qo'shish
            </button>

            <div className="employees-grid">
              {staff.map((person) => (
                <div
                  key={person.id}
                  className="employee-card"
                  data-position={
                    person.role === "KITCHEN" ? "Oshpaz" :
                    person.role === "CASHIER" ? "Ofitsiant" :
                    person.role === "CUSTOMER" ? "Boshqaruvchi" :
                    "Direktor"
                  }
                >
                  <div className="employee-position">
                    {person.role === "KITCHEN" ? "Oshpaz" :
                     person.role === "CASHIER" ? "Ofitsiant" :
                     person.role === "CUSTOMER" ? "Boshqaruvchi" :
                     "Direktor"}
                  </div>
                  <h3 className="employee-name">
                    {person.name} {person.surname}
                  </h3>
                  <div className="employee-contact">
                    <Phone size={16} className="employee-contact-icon" />
                    <span>{person.phone}</span>
                  </div>
                  <div className="employee-actions">
                    <button
                      className="btn btn-primary employee-action-btn btn-with-icon"
                      onClick={() => setEditingStaff(person)}
                    >
                      <Edit size={16} />
                      O'zgartirish
                    </button>
                    <button
                      className="btn btn-danger employee-action-btn btn-with-icon"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          `Rostdan ham "${person.name} ${person.surname}" (${
                            person.role === "KITCHEN" ? "Oshpaz" :
                            person.role === "CASHIER" ? "Ofitsiant" :
                            person.role === "CUSTOMER" ? "Boshqaruvchi" :
                            "Direktor"
                          }) xodimini o'chirmoqchimisiz?`
                        );
                        if (confirmDelete) {
                          axios.delete(`https://suddocs.uz/user/${person.id}`, {
                            headers: {
                              "Content-Type": "application/json",
                              ...(localStorage.getItem("token") && { Authorization: `Bearer ${localStorage.getItem("token")}` }),
                            },
                          }).then(() => {
                            setStaff(staff.filter((s) => s.id !== person.id));
                          }).catch((err) => {
                            console.error("Xodimni o'chirishda xatolik:", err);
                            alert("Xodimni o'chirishda xatolik yuz berdi.");
                          });
                        }
                      }}
                    >
                      <Trash size={16} />
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {showAddModal && (
        <div
          className={`modal-backdrop ${showAddModal ? "active" : ""}`}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Yangi Xodim Qo'shish</h3>
            </div>
            <div className="modal-body1">
              <div className="form-group">
                <label className="form-label">Lavozim</label>
                <select
                  className="form-control"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                >
                  {roleOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ismi</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ismi"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Familiyasi</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Familiyasi"
                  value={newStaff.surname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, surname: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Login"
                  value={newStaff.username}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+998 XX XXX XX XX"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parol</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Parol"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={handleAddStaff}>
                Qo'shish
              </button>
              <button className="btn btn-danger" onClick={() => setShowAddModal(false)}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStaff && (
        <div
          className={`modal-backdrop ${editingStaff ? "active" : ""}`}
          onClick={() => setEditingStaff(null)}
        >
          <div
            className="modal fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Xodimni Tahrirlash</h3>
            </div>
            <div className="modal-body1">
              <div className="form-group">
                <label className="form-label">Lavozim</label>
                <select
                  className="form-control"
                  value={editingStaff.role}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, role: e.target.value })
                  }
                >
                  {roleOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Login"
                  value={editingStaff.username}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, username: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Yangi Parol (agar kerak bo'lsa)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Yangi Parol (agar kerak bo'lsa)"
                  value={editingStaff.password}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, password: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+998 XX XXX XX XX"
                  value={editingStaff.phone}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={handleStaffSave}>
                Saqlash
              </button>
              <button className="btn btn-danger" onClick={() => setEditingStaff(null)}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}