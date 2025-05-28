import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Sozlamalar.css";

const roleOptions = [
  { id: 1, value: "KITCHEN", label: "Oshpaz" },
  { id: 2, value: "CASHIER", label: "Ofitsiant" },
  { id: 3, value: "CUSTOMER", label: "Boshqaruvchi" },
  { id: 3, value: "DIRECTOR", label: "Director" }
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
            "Content-Type": "application/json"
          },
        });
        const users = response.data.map((user) => ({
          id: user.id,
          role: user.role || "KITCHEN",
          name: user.name || "",
          surname: user.surname || "",
          phone: user.phone || ""
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
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring (Ism, Familiyasi, Telefon, Login, Parol).");
      return;
    }
    try {
      const staffData = {
        name: newStaff.name,
        surname: newStaff.surname,
        username: newStaff.username,
        phone: newStaff.phone,
        password: newStaff.password,
        role: newStaff.role
      };
      console.log("Sending data:", staffData);
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
    <>
      <h3
        style={{
          margin: "0",
          marginTop: "-15px",
          marginLeft: "-5px",
          fontSize: "25px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
        }}
      >
        Sozlamalar
      </h3>
      <div className="sozlamalar-wrapper">
        <section className="staff-settings">
          <h3
            style={{
              margin: "0",
              marginTop: "-8px",
              marginLeft: "3px",
              fontSize: "25px",
              fontWeight: "bold",
              fontFamily: "sans-serif",
            }}
          >
            Xodimlar
          </h3>
          {loading ? (
            <div className="spinner"></div>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                style={{ marginBottom: "10px" }}
              >
                ➕ Yangi xodim qo'shish
              </button>

              <ul className="staff-list">
                {staff.map((person) => (
                  <li key={person.id} className="staff-card">
                    <div>
                      <strong>{person.role === "KITCHEN" ? "Oshpaz" : person.role === "CASHIER" ? "Ofitsiant" : "Boshqaruvchi"}</strong>: {person.name} {person.surname}
                      <br />
                      <small>
                        Telefon raqami: <strong>{person.phone}</strong>
                      </small>
                    </div>
                    <div className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => setEditingStaff(person)}
                      >
                        🖊 O'zgartirish
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => {
                          const confirmDelete = window.confirm(
                            `Rostdan ham "${person.name} ${person.surname}" (${person.role === "KITCHEN" ? "Oshpaz" : person.role === "CASHIER" ? "Ofitsiant" : "Boshqaruvchi"}) xodimini o'chirmoqchimisiz?`
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
                        🗑 O'chirish
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {showAddModal && (
          <div className="overley">
            <div className="modal"
            style={{ height: "auto", width: "auto", maxWidth: "600px", padding: "20px" }}
            >
              <div className="modal-content">
                <h3>Yangi xodim qo‘shish</h3>
                <select
                  style={{ width: "8em" }}
                  className="modal-input"
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
                <br />
                <input
                  type="text"
                  style={{ height: "1.5em" }}
                  className="modal-input"
                  placeholder="Ismi"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                />
                <br />
                <input
                  type="text"
                  style={{ height: "1.5em" }}
                  className="modal-input"
                  placeholder="Familiyasi"
                  value={newStaff.surname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, surname: e.target.value })
                  }
                />
                <br />
                <input
                  type="text"
                  style={{ height: "1.5em" }}
                  className="modal-input"
                  placeholder="Login"
                  value={newStaff.username}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, username: e.target.value })
                  }
                />
                <br />
                <input
                  type="tel"
                  style={{ height: "1.5em" }}
                  placeholder="Telefon"
                  className="modal-input"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                />
                <br />
                <input
                  type="password"
                  style={{ height: "1.5em" }}
                  className="modal-input"
                  placeholder="Parol"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
                <div className="modal-actions">
                  <button className="edit-btn" style={{ marginBottom: "10px" }} onClick={handleAddStaff}>
                    Qo'shish
                  </button>
                  <button
                    className="delete-btn"
                    style={{ marginBottom: "10px" }}
                    onClick={() => setShowAddModal(false)}
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingStaff && (
          <div className="overley">
            <div className="modal"
            style={{ height: "auto", width: "auto", maxWidth: "600px", padding: "20px" }}
            >
              <div className="modal-content">
                <h3>Xodimni tahrirlash</h3>
                <select
                  style={{ width: "8em" }}
                  className="modal-input"
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
                <br />
                <input
                  type="text"
                  style={{ height: "1.5em" }}
                  value={editingStaff.username}
                  className="modal-input"
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, username: e.target.value })
                  }
                  placeholder="Login yangilsh"
                />
                <br />
                <input
                  type="text"
                  style={{ height: "1.5em" }}
                  value={editingStaff.password}
                  className="modal-input"
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, password: e.target.value })
                  }
                  placeholder="Parol yangilash"
                />
                <br />
                <input
                  type="tel"
                  style={{ height: "1.5em" }}
                  value={editingStaff.phone}
                  className="modal-input"
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, phone: e.target.value })
                  }
                  placeholder="Telefon"
                />
                <div className="modal-actions">
                  <button className="edit-btn" style={{ paddingBottom: "10px" }} onClick={handleStaffSave}>
                    Saqlash
                  </button>
                  <button
                    className="delete-btn"
                    style={{ paddingBottom: "10px" }}
                    onClick={() => setEditingStaff(null)}
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}