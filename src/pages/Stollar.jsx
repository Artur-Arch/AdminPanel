import React, { useState, useEffect } from "react";
import axios from "axios";
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

  const API_URL = "https://suddocs.uz/tables";

  const statusMapToBackend = { "Bo'sh": "empty", Band: "busy" };
  const statusMapToFrontend = { empty: "Bo'sh", busy: "Band" };

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
          console.log(`Stol ${table.id} statusi "Bo'sh" ga o'zgartirildi`);
        }
      }
    } catch (error) {
      console.error(
        "Statuslarni tekshirishda xato:",
        error.response?.data || error.message
      );
      setError("Stol statuslarini yangilashda xato");
    }
  };

  const handleAddStol = async () => {
    if (!newStol.name || !newStol.number) {
      setError("Iltimos, stol nomi va raqamini kiriting");
      return;
    }

    try {
      const res = await axios.post(API_URL, {
        name: newStol.name,
        number: parseInt(newStol.number),
        status: statusMapToBackend[newStol.status],
      });

      const newTable = {
        ...res.data.data,
        status:
          statusMapToFrontend[res.data.data.status] || res.data.data.status,
        orders: [],
      };

      setStollar([...stollar, newTable]);
      setNewStol({ name: "", number: "", status: "Bo'sh" });
      setModal(false);
      setError(null);
    } catch (err) {
      console.error("Stol qo'shishda xato:", err);
      setError("Stol qo'shishda xato");
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
      await axios.delete(`${API_URL}/${id}`);
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
    <>
      <h3
        style={{
          marginTop: "-15px",
          marginLeft: "-5px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          marginBottom: "10px",
          fontSize: "25px",
        }}
      >
        Stollar
      </h3>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="stollar">
          <nav className="stolCat menu-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={
                  filter === cat ? "main-stolBtn active" : "main-stolBtn"
                }
                onClick={() => setFilter(cat)}
              >
                {cat} stollar
              </button>
            ))}
          </nav>

          <div className="stol-container">
            <article>
              <div className="stolAddCard add-card">
                <button
                  className="addMenu"
                  onClick={() => {
                    setModal(true);
                    setError(null);
                  }}
                >
                  +
                </button>
                <h3>Stol qo'shish</h3>
              </div>
            </article>

            {stollar
              .filter((s) => filter === "Barcha" || s.status === filter)
              .map((stol) => {
                const tableOrders = getOrdersForTable(stol.id);
                return (
                  <article key={stol.id}>
                    <div
                      className={`stolAddCard ${
                        stol.status === "Band" ? "busy" : "free"
                      }`}
                    >
                      <h4 className="main-text">{stol.name}</h4>
                      <p className="stol-info">Raqami: {stol.number}</p>
                      <p className="stol-info">
                        Holati: <strong>{stol.status}</strong>
                      </p>
                      <p className="stol-info">
                        Faol buyurtmalar: <strong>{tableOrders.length}</strong>
                      </p>
                      {tableOrders.length > 0 && (
                        <button
                          className="view-orders-btn"
                          onClick={() => handleShowOrders(stol)}
                        >
                          Buyurtmalarni ko'rish
                        </button>
                      )}
                      <button
                        className="deleteBtn"
                        onClick={() => handleDelete(stol.id, stol.name)}
                      >
                        🗑️ O'chirish
                      </button>
                      <button
                        className={`status-btn ${
                          stol.status === "Bo'sh" ? "free" : "busy"
                        }`}
                        onClick={() => handleStatusChange(stol.id, stol.status)}
                      >
                        {stol.status === "Bo'sh" ? "Band qilish" : "Bo'shatish"}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal-stol">
            <h3>Yangi stol qo'shish</h3>
            <input
              className="modal2-input"
              type="text"
              placeholder="Stol nomi"
              value={newStol.name}
              onChange={(e) => setNewStol({ ...newStol, name: e.target.value })}
            />
            <input
              className="modal2-input"
              type="number"
              placeholder="Stol raqami"
              value={newStol.number}
              onChange={(e) =>
                setNewStol({ ...newStol, number: e.target.value })
              }
            />
            <select
              className="modal2-input"
              value={newStol.status}
              onChange={(e) =>
                setNewStol({ ...newStol, status: e.target.value })
              }
            >
              <option value="Bo'sh">Bo'sh</option>
              <option value="Band">Band</option>
            </select>
            <div className="modal-stolBtn">
              <button className="modal-btn1" onClick={handleAddStol}>
                Qo'shish
              </button>
              <button
                className="modal-btn2"
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
        <div className="modal-overlay">
          <div className="modal-stol">
            <h3>{selectedTable.name} uchun buyurtmalar</h3>
            <div className="orders-list">
              {getOrdersForTable(selectedTable.id).length === 0 ? (
                <p className="no-orders">Faol buyurtmalar yo'q</p>
              ) : (
                getOrdersForTable(selectedTable.id).map((order) => (
                  <div
                    key={order.id}
                    className="order-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p>
                      <strong>Buyurtma №{order.id}</strong>
                    </p>
                    <div className="order-items-list">
                      <span>Taomlar:</span>
                      {order.orderItems.length > 0 ? (
                        order.orderItems.map((item, index) => (
                          <div
                            key={index}
                            className="order-item-detail"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              margin: "5px 0",
                            }}
                          >
                            <img
                              src={
                                item.product?.image
                                  ? `https://suddocs.uz${item.product.image}`
                                  : "https://suddocs.uz/placeholder.png"
                              }
                              alt={item.product?.name || "Product"}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                            <span>
                              {item.product?.name || "Nomalum taom"} (
                              {item.count})
                            </span>
                          </div>
                        ))
                      ) : (
                        <span>Buyurtmada taomlar yo'q</span>
                      )}
                    </div>
                    <p>Narxi: {formatPrice(order.totalPrice)}</p>
                  </div>
                ))
              )}
            </div>
            <button
              className="modal-btn2"
              onClick={() => {
                setOrderModal(false);
                setSelectedTable(null);
              }}
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
