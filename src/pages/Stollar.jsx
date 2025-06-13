import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, Edit, Eye, Loader2 } from "lucide-react";
import "./styles/Stollar.css";

export default function Stollar() {
  const [stollar, setStollar] = useState([]);
  const [modal, setModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [filter, setFilter] = useState("Barcha");
  const [newStol, setNewStol] = useState({
    name: "",
    number: "",
    status: "Bo'sh",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://alikafecrm.uz/tables";

  const statusMapToBackend = { "Bo'sh": "empty", Band: "busy" };
  const statusMapToFrontend = { empty: "Bo'sh", busy: "Band" };

  const calculateTotalPrice = (orderItems) => {
    return orderItems.reduce(
      (sum, item) => sum + parseFloat(item.product?.price || 0) * item.count,
      0
    );
  };

  useEffect(() => {
    const fetchStollar = async () => {
      try {
        const res = await axios.get(API_URL);
        const result = res.data;

        if (result.success && Array.isArray(result.data)) {
          const mappedData = result.data.map((stol) => ({
            ...stol,
            status: statusMapToFrontend[stol.status] || stol.status,
            orders: Array.isArray(stol.orders)
              ? stol.orders
                  .filter((order) => order.status !== "ARCHIVE")
                  .map((order) => ({
                    ...order,
                    orderItems: Array.isArray(order.orderItems)
                      ? order.orderItems
                      : [],
                  }))
              : [],
          }));
          setStollar(mappedData);
          await checkAndUpdateStatuses(mappedData);
        } else {
          setError(result.message || "Stollarni olishda xato yuz berdi");
        }
      } catch (error) {
        console.error("Stollarni olishda xato:", error);
        setError("API bilan bog'lanishda xato");
      } finally {
        setLoading(false);
      }
    };

    fetchStollar();
  }, []);

  const checkAndUpdateStatuses = async (tables) => {
    try {
      for (const table of tables) {
        if (table.orders.length === 0 && table.status === "Band") {
          await axios.patch(
            `${API_URL}/${table.id}`,
            { status: "empty" },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setStollar((prev) =>
            prev.map((stol) =>
              stol.id === table.id ? { ...stol, status: "Bo'sh" } : stol
            )
          );
        }
      }
    } catch (error) {
      console.error("Statuslarni tekshirishda xato:", error.response?.data || error.message);
      setError("Stol statuslarini yangilashda xato");
    }
  };

  const handleAddStol = async () => {
    if (!newStol.name || !newStol.number) {
      setError("Iltimos, stol nomi va raqamini kiriting");
      return;
    }
    if (!["Bo'sh", "Band"].includes(newStol.status)) {
      setError("Iltimos, to'g'ri status tanlang");
      return;
    }

    try {
      const res = await axios.post(
        API_URL,
        {
          name: newStol.name,
          number: parseInt(newStol.number),
          status: statusMapToBackend[newStol.status],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const newTable = {
        ...res.data.data,
        status: statusMapToFrontend[res.data.data.status] || res.data.data.status,
        orders: [],
      };

      setStollar([...stollar, newTable]);
      setNewStol({ name: "", number: "", status: "Bo'sh" });
      setModal(false);
      setError(null);
    } catch (err) {
      console.error("Stol qo'shishda xato:", err);
      const errorMessage = err.response?.data?.message || err.message || "Stol qo'shishda xato";
      setError(errorMessage);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newFrontendStatus = currentStatus === "Bo'sh" ? "Band" : "Bo'sh";
    const newBackendStatus = statusMapToBackend[newFrontendStatus];

    try {
      await axios.patch(
        `${API_URL}/${id}`,
        { status: newBackendStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setStollar((prev) =>
        prev.map((stol) =>
          stol.id === id ? { ...stol, status: newFrontendStatus } : stol
        )
      );
    } catch (err) {
      console.error("Statusni o'zgartirishda xato:", err);
      setError("Statusni o'zgartirishda xato");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" stolni o'chirishni xohlaysizmi?`)) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setStollar((prev) => prev.filter((stol) => stol.id !== id));
      setError(null);
    } catch (err) {
      console.error("Stolni o'chirishda xato:", err);
      setError("Stolni o'chirishda xato");
    }
  };

  const handleShowOrders = (table) => {
    setSelectedTable(table);
    setOrderModal(true);
  };

  const formatPrice = (price) => {
    const priceStr = price.toString();
    return priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  };

  const getOrdersForTable = (tableId) => {
    const table = stollar.find((stol) => stol.id === tableId);
    if (!table) return [];
    return table.orders;
  };

  const categories = ["Barcha", "Bo'sh", "Band"];

  return (
    <div className="app">
      <div className="main-content">
        <div style={{
          marginTop: "-45px",
        }} className="main-content-table">
          <h1 className="section-title1">Stollar</h1>
          {error && <div className="text-danger">{error}</div>}
        </div>
        {loading ? (
          <div className="spinner">
          </div>
        ) : (
          <div>
            <div className="filter-container">
              <div className="filter-buttons">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-button ${filter === cat ? "active" : ""}`}
                    onClick={() => setFilter(cat)}
                  >
                    {cat} stollar
                  </button>
                ))}
              </div>
            </div>
            <div className="table-grid">
              <div className="table-card add-table-card">
                <button
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="action-button primary add-table-button"
                  onClick={() => {
                    setModal(true);
                    setError(null);
                  }}
                >
                  <Plus size={52} />
                  <span>Stol qo'shish</span>
                </button>
              </div>
              {stollar
                .filter((s) => filter === "Barcha" || s.status === filter)
                .map((stol) => {
                  const tableOrders = getOrdersForTable(stol.id);
                  return (
                    <div
                      key={stol.id}
                      className={`table-card ${stol.status === "Band" ? "band" : "bosh"}`}
                    >
                      <div className="table-header">
                        <h3 className="table-number">{stol.name}</h3>
                        <span
                          className={`status-badge ${stol.status === "Band" ? "band" : "bosh"}`}
                        >
                          {stol.status}
                        </span>
                      </div>
                      <div className="table-info">
                        <div className="info-row">
                          <span className="info-label">Raqami:</span>
                          <span className="info-value">{stol.number}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Faol buyurtmalar:</span>
                          <span className="info-value">{tableOrders.length}</span>
                        </div>
                      </div>
                      <div className="table-actions">
                        {tableOrders.length > 0 && (
                          <button
                            className="action-button primary"
                            onClick={() => handleShowOrders(stol)}
                          >
                            <Eye size={16} />
                            Buyurtmalarni ko'rish
                          </button>
                        )}
                        <button
                          className="action-button danger"
                          onClick={() => handleDelete(stol.id, stol.name)}
                        >
                          <Trash size={16} />
                          O'chirish
                        </button>
                        <button
                          className={`action-button ${stol.status === "Bo'sh" ? "success" : "primary"}`}
                          onClick={() => handleStatusChange(stol.id, stol.status)}
                        >
                          <Edit size={16} />
                          {stol.status === "Bo'sh" ? "Band qilish" : "Bo'shatish"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {modal && (
          <div
            className={`modal-backdrop ${modal ? "active" : ""}`}
            onClick={() => {
              setModal(false);
              setError(null);
            }}
          >
            <div
              className="modal fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Yangi stol qo'shish</h2>
              </div>
              <div className="modal-body1">
                <div className="form-group">
                  <label className="form-label">Stol nomi</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Stol nomi"
                    value={newStol.name}
                    onChange={(e) => setNewStol({ ...newStol, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stol raqami</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Stol raqami"
                    value={newStol.number}
                    onChange={(e) => setNewStol({ ...newStol, number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={newStol.status}
                    onChange={(e) => setNewStol({ ...newStol, status: e.target.value })}
                  >
                    <option value="Bo'sh">Bo'sh</option>
                    <option value="Band">Band</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleAddStol}>
                  Qo'shish
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setModal(false);
                    setError(null);
                  }}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}
        {orderModal && selectedTable && (
          <div
            className={`modal-backdrop ${orderModal ? "active" : ""}`}
            onClick={() => {
              setOrderModal(false);
              setSelectedTable(null);
            }}
          >
            <div
              style={{ maxWidth: "600px", width: "100%" }}
              className="modal fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">{selectedTable.name} uchun buyurtmalar</h2>
              </div>
              <div className="modal-body1">
                {getOrdersForTable(selectedTable.id).length === 0 ? (
                  <p className="text-secondary">Faol buyurtmalar yo'q</p>
                ) : (
                  getOrdersForTable(selectedTable.id).map((order) => (
                    <div key={order.id} className="order-item">
                      <div className="order-items-list">
                        <p style={{
                          marginTop: "-15px",
                          marginBottom: "0px"
                        }} className="info-label">
                          <strong>Buyurtma №{order.id}</strong>
                        </p>
                        <span className="info-label">Taomlar:</span>
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}>
                          {order.orderItems.length > 0 ? (
                            order.orderItems.map((item, index) => (
                              <div key={index} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px"
                              }} className="order-item-detail">
                                <img
                                  src={
                                    item.product?.image
                                      ? `https://alikafecrm.uz${item.product.image}`
                                      : "https://alikafecrm.uz/placeholder.png"
                                  }
                                  alt={item.product?.name || "Product"}
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                                <span style={{
                                  fontSize: "22px",
                                }} className="info-value">
                                  {item.product?.name || "Nomalum taom"} ({item.count})
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-secondary">Buyurtmada taomlar yo'q</span>
                          )}
                        </div>
                        <p style={{
                          borderTop: "0.5px solid var(--gray-200)",
                          width: "230px",
                          paddingLeft: "5px",
                          paddingRight: "5px",
                          paddingTop: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "end",
                          gap: "10px",
                          marginTop: "20px",
                          marginBottom: "-20px",
                          fontSize: "20px",
                        }} className="info-row">
                          <span className="info-label">Narxi:</span>
                          <span className="info-value">{formatPrice(calculateTotalPrice(order.orderItems))}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setOrderModal(false);
                    setSelectedTable(null);
                  }}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}