import React from "react";
import { useState } from "react";
import "./styles/Sozlamalar.css";

export default function Sozlamalar() {
  const [staff, setStaff] = useState([
    { id: 1, role: "Oshpaz", name: "Aliyev", phone: "+998901234567" },
    { id: 2, role: "Ofitsiant", name: "Karimov", phone: "+998907654321" },
    { id: 3, role: "Ofitsiant", name: "Ali", phone: "+998937078047"}
  ]);
  const [restaurant, setRestaurant] = useState({
    name: 'Choyxona "Navruz"',
    address: "Gurlan, Xorazm",
    hours: "10:00 - 23:00",
  });
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    role: "Oshpaz",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestaurantData, setEditingRestaurantData] =
    useState(restaurant);

  const handleStaffSave = () => {
    setStaff((prev) =>
      prev.map((s) => (s.id === editingStaff.id ? editingStaff : s))
    );
    setEditingStaff(null);
  };

  const handleRestaurantSave = () => {
    console.log("Saving", editingRestaurantData);
    
    setRestaurant(editingRestaurantData);
    setEditingRestaurant(false);
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.phone) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }
    const newId = Date.now();
    setStaff([...staff, { id: newId, ...newStaff }]);
    setNewStaff({ name: "", phone: "", role: "Oshpaz" });
    setShowAddModal(false);
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
          <ul className="staff-list">
            <button
              onClick={() => setShowAddModal(true)}
              style={{ marginBottom: "10px" }}
            >
              ➕ Yangi xodim qo'shish
            </button>

            {staff.map((person) => (
              <li key={person.id} className="staff-card">
                <div>
                  <strong>{person.role}</strong>: {person.name}
                  <br />
                  <small>
                    Telefon raqami: <strong>{person.phone}</strong>
                  </small>
                </div>
                <div className="actions">
                  <button className="edit-btn" onClick={() => setEditingStaff(person)}>
                    🖊 O'zgartirish
                  </button>
                  <button
                      className="delete-btn"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          `Rostdan ham "${person.name}" (${person.role}) xodimini o'chirmoqchimisiz?`
                        );
                        if (confirmDelete) {
                          setStaff(staff.filter((s) => s.id !== person.id));
                        }
                      }}
                  >
                    🗑 O'chirish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="restaurant-settings">
          <h3
            style={{
              margin: "0",
              marginTop: "-25px",
              marginLeft: "-5px",
              fontSize: "25px",
              fontWeight: "bold",
              fontFamily: "sans-serif",
            }}
          >
            Restoran sozlamalari
          </h3>
          <div className="restaurant-card">
            <p>
              <strong>Nomi:</strong> {restaurant.name}
            </p>
            <p>
              <strong>Manzil:</strong> {restaurant.address}
            </p>
            <p>
              <strong>Ish vaqti:</strong> {restaurant.hours}
            </p>
            <button
              onClick={() => {
                setEditingRestaurant(true),
                  setEditingRestaurantData(restaurant);
              }}
              className="edit-btn"
            >
              🖊 O'zgartirish
            </button>
          </div>
        </section>

        {showAddModal && (
          <div className="overley">
            <div className="modal">
              <div className="modal-content">
                <h3>Yangi xodim qo‘shish</h3>
                <select
                  style={{width: '8em'}}
                  className="modal-input"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                >
                  <option value="Oshpaz">Oshpaz</option>
                  <option value="Ofitsiant">Ofitsiant</option>
                </select>
                <br />
                <input
                  type="text"
                  style={{height: '1.5em'}}
                  className="modal-input"
                  placeholder="Ismi"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                />
                <br />
                <input
                  type="number"
                  style={{height: '1.5em'}}
                  placeholder="Telefon"
                  className="modal-input"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                />
                <div className="modal-actions">
                  <button className="edit-btn"  style={{marginBottom: '10px'}} onClick={handleAddStaff}>Qo'shish</button>
                  <button className="delete-btn" style={{marginBottom: '10px'}} onClick={() => setShowAddModal(false)}>
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingStaff && (
          <div className="overley">
            <div className="modal">
              <div className="modal-content">
                <h3>Xodimni tahrirlash</h3>
                <input
                  type="text"
                  style={{height: '1.5em'}}
                  value={editingStaff.name}
                  className="modal-input"
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, name: e.target.value })
                  }
                  placeholder="Ismi"
                /><br/>
                <input
                  type="text"
                  style={{height: '1.5em'}}
                  value={editingStaff.phone}
                  className="modal-input"
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, phone: e.target.value })
                  }
                  placeholder="Telefon"
                />
                <div className="modal-actions">
                  <button className="edit-btn"  style={{paddingBottom: '10px'}} onClick={handleStaffSave}>Saqlash</button>
                  <button className="delete-btn" style={{paddingBottom: '10px'}} onClick={() => setEditingStaff(null)}>
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingRestaurant && (
          <div className="overley">
            <div className="modal">
              <div className="modal-content">
                <h3>Restoran ma'lumotlarini tahrirlash</h3>
                <input
                  type="text"
                  style={{height: '1.5em'}}
                  className="modal-input"
                  value={editingRestaurantData.name}
                  onChange={(e) =>
                    setEditingRestaurantData({
                      ...editingRestaurantData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Restoran nomi"
                />
                <br />
                <input
                  type="text"
                  style={{height: '1.5em'}}
                  className="modal-input"
                  value={editingRestaurantData.address}
                  onChange={(e) =>
                    setEditingRestaurantData({
                      ...editingRestaurantData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Manzil"
                />
                <br />
                <input
                  type="text"
                  className="modal-input"
                  style={{height: '1.5em'}}
                  value={editingRestaurantData.hours}
                  onChange={(e) =>
                    setEditingRestaurantData({
                      ...editingRestaurantData,
                      hours: e.target.value,
                    })
                  }
                  placeholder="Ish vaqti"
                />
                <div className="modal-actions">
                  <button className="edit-btn" style={{paddingBottom: '10px'}} onClick={handleRestaurantSave}>Saqlash</button>
                  <button
                    className="delete-btn"
                    style={{paddingBottom: '10px'}}
                    onClick={() => {
                      setEditingRestaurantData(restaurant);
                      setEditingRestaurant(false);
                    }}
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
