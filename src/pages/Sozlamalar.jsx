import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Plus, Edit, Trash, Phone, Loader2 } from 'lucide-react';
import { setRestaurantName } from '../store/actions/restaurantSlice'; // Исправленный импорт
import CommissionInput from '../components/CommissionInput';
import './styles/Sozlamalar.css';

const roleOptions = [
  { id: 1, value: 'KITCHEN', label: 'Oshpaz' }, // Повар
  { id: 2, value: 'CASHIER', label: 'Ofitsiant' }, // Официант
  { id: 3, value: 'CUSTOMER', label: 'Admin' }, // Менеджер
  { id: 4, value: 'BIGADMIN', label: 'Direktor' }, // Директор
];

export default function Sozlamalar() {
  const dispatch = useDispatch();
  const restaurantName = useSelector((state) => state.restaurant.restaurantName);
  const [tempRestaurantName, setTempRestaurantName] = useState(restaurantName);
  const [staff, setStaff] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    surname: '',
    username: '',
    phone: '',
    password: '',
    role: 'KITCHEN',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://alikafecrm.uz/user', {
          headers: { 'Content-Type': 'application/json' },
        });
        const users = response.data.map((user) => ({
          id: user.id,
          role: user.role || 'KITCHEN',
          name: user.name || '',
          surname: user.surname || '',
          phone: user.phone || '',
          username: user.username || '',
          password: '',
        }));
        setStaff(users);

        try {
          const restaurantResponse = await axios.get('https://alikafecrm.uz/', {
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
            },
          });
          dispatch(setRestaurantName(restaurantResponse.data.name || 'Otabek kafe'));
          setTempRestaurantName(restaurantResponse.data.name || 'Otabek kafe');
        } catch (err) {
          dispatch(setRestaurantName('Otabek kafe'));
          setTempRestaurantName('Otabek kafe');
        }
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleRestaurantNameSave = async () => {
    if (!tempRestaurantName.trim()) {
      alert("Choyxona nomi bo'sh bo'lishi mumkin emas.");
      return;
    }
    try {
      await axios.put(
        'https://alikafecrm.uz',
        { name: tempRestaurantName },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
          },
        }
      );
      dispatch(setRestaurantName(tempRestaurantName));
      alert('Nomi saqlandi.');
    } catch (err) {
      dispatch(setRestaurantName(tempRestaurantName));
      alert("Nomi mahalliy ravishda saqlandi.");
    }
  };

  const handleStaffSave = async () => {
    try {
      const staffData = {
        username: editingStaff.username,
        password: editingStaff.password,
        phone: editingStaff.phone,
        role: editingStaff.role,
      };
      await axios.put(`https://alikafecrm.uz/user/${editingStaff.id}`, staffData, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
        },
      });
      setStaff((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...editingStaff, ...staffData } : s))
      );
      setEditingStaff(null);
    } catch (err) {
      alert("Xodim ma'lumotlarini saqlashda xatolik yuz berdi.");
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.username || !newStaff.password) {
      alert("Barcha majburiy maydonlarni to'ldiring.");
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
      const response = await axios.post('https://alikafecrm.uz/user', staffData, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
        },
      });
      setStaff([...staff, { id: response.data.id, ...staffData }]);
      setNewStaff({ name: '', surname: '', username: '', phone: '', password: '', role: 'KITCHEN' });
      setShowAddModal(false);
    } catch (err) {
      alert("Xodim qo'shishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1 style={{ color: '#ffffff' }} className="app-title">
          Sozlamalar
        </h1>
      </header>
      <section className="restaurant-name-section">
        <label style={{
          marginBottom: "5px"
        }} className="section-title">Choyxona nomi</label>
        <div className="form-group">
          <input
            style={{
              width: "300px"
            }}
            type="text"
            className="form-control"
            placeholder="Choyxona nomini kiriting"
            value={tempRestaurantName}
            onChange={(e) => setTempRestaurantName(e.target.value)}
          />
          <button style={{
            marginTop: "10px"
          }} className="btn btn-success" onClick={handleRestaurantNameSave}>
            Saqlash
          </button>
        </div>
      </section>
      <section className="add-employee-section">
        <h2 className="section-title">Xodimlar</h2>
        {loading ? (
          <div className="spinner">
            <Loader2 className="animate-spin" />
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
              Xodim qo'shish
            </button>
            <div className="employees-grid">
              {staff.map((person) => (
                <div
                  key={person.id}
                  className="employee-card"
                  data-position={
                    person.role === 'KITCHEN'
                      ? 'Oshpaz'
                      : person.role === 'CASHIER'
                      ? 'Ofitsiant'
                      : person.role === 'CUSTOMER'
                      ? 'Menejer'
                      : 'Direktor'
                  }
                >
                  <div className="employee-position">
                    {person.role === 'KITCHEN'
                      ? 'Oshpaz'
                      : person.role === 'CASHIER'
                      ? 'Ofitsiant'
                      : person.role === 'CUSTOMER'
                      ? 'Admin'
                      : 'Direktor'}
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
                      Tahrirlash
                    </button>
                    <button
                      className="btn btn-danger employee-action-btn btn-with-icon"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          `"${person.name} ${person.surname}" (${
                            person.role === 'KITCHEN'
                              ? 'Oshpaz'
                              : person.role === 'CASHIER'
                              ? 'Ofitsiant'
                              : person.role === 'CUSTOMER'
                              ? 'Admin'
                              : 'Direktor'
                          }) haqiqatdan o'chirilsinmi?`
                        );
                        if (confirmDelete) {
                          axios
                            .delete(`https://alikafecrm.uz/user/${person.id}`, {
                              headers: {
                                'Content-Type': 'application/json',
                                ...(localStorage.getItem('token') && {
                                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                                }),
                              },
                            })
                            .then(() => {
                              setStaff(staff.filter((s) => s.id !== person.id));
                            })
                            .catch((err) => {
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
      <section className="commission-section">
        <h2 className="section-title">Komissiya</h2>
        <CommissionInput orderAmount={100000} />
      </section>
      {showAddModal && (
        <div
          className={`modal-backdrop ${showAddModal ? 'active' : ''}`}
          onClick={() => setShowAddModal(false)}
        >
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xodim qo'shish</h3>
            </div>
            <div className="modal-body1">
              <div className="form-group">
                <label className="form-label">Lavozim</label>
                <select
                  className="form-control"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  {roleOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ism</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ism"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Familiya</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Familiya"
                  value={newStaff.surname}
                  onChange={(e) => setNewStaff({ ...newStaff, surname: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Login"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+998 XX XXX XX XX"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parol</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Parol"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
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
          className={`modal-backdrop ${editingStaff ? 'active' : ''}`}
          onClick={() => setEditingStaff(null)}
        >
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xodimni tahrirlash</h3>
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
                <label className="form-label">Yangi parol (agar kerak bo'lsa)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Yangi parol (agar kerak bo'lsa)"
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