import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "./styles/AdminPanel.css";

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState("");

  const commissionRate = useSelector((state) => state.commission.commissionRate);

  const fetchData = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        axios.get("https://alikafecrm.uz/order"),
        axios.get("https://alikafecrm.uz/tables"),
      ]);

      const sanitizedOrders = ordersRes.data
        .map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }))
        .sort((a, b) => {
          if (a.status === "ARCHIVE" && b.status !== "ARCHIVE") return 1;
          if (a.status !== "ARCHIVE" && b.status === "ARCHIVE") return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      setOrders((prevOrders) => {
        if (JSON.stringify(prevOrders) !== JSON.stringify(sanitizedOrders)) {
          return sanitizedOrders;
        }
        return prevOrders;
      });
      setTables(tablesRes.data.data);
    } catch (error) {
      console.error("Ma'lumotlarni olishda xatolik:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tableMap = tables.reduce((map, table) => {
    map[table.id] = table.number;
    return map;
  }, {});

  const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} so'm`;
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setModalType("view");
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setModalType("edit");
  };

  const handleDelete = async (orderId) => {
    const confirmDelete = window.confirm("Rostdan ham bu zakazni o'chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://alikafecrm.uz/order/${orderId}`);
      alert("Zakaz o'chirildi");
      await fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setModalType("");
      }
    } catch (error) {
      alert("O'chirishda xatolik yuz berdi");
      console.error("O'chirish xatosi:", error);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING": return "Navbatda";
      case "COOKING": return "Tayyorlanmoqda";
      case "READY": return "Tayyor";
      case "COMPLETED": return "Mijoz oldida";
      case "ARCHIVE": return "Tugallangan";
      default: return status;
    }
  };

  return (
    <div className="app">
      <header className="header1">
        <h1 style={{ color: '#ffffff', marginTop: "-30px", marginLeft: "10px", fontSize: "40px" }}>
          Administrator paneli
        </h1>
      </header>
      <div style={{ marginTop: "5px" }} className="admin-panel">
        <section className="orders-section">
          <h2>Barcha Zakazlar</h2>
          {orders.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
              Buyurtmalar yo'q
            </p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Zakaz №</th>
                    <th>Stol</th>
                    <th>Taom</th>
                    <th>Komissiya (4%)</th>
                    <th>Umumiy narxi</th>
                    <th>Komissiya</th>
                    <th>Jami</th>
                    <th>Holati</th>
                    <th>Sana</th>
                    <th>Bajariladigan ishi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const commission = order.totalPrice * (commissionRate / 100);
                    const totalWithCommission = order.totalPrice + commission;
                    return (
                      <tr key={`${order.id}-${index}`}>
                        <td>№ {order.id}</td>
                        <td>{tableMap[order.tableId] || "N/A"}</td>
                        <td className="item-column">
                          {order.orderItems.map((item) => `${item.product.name} (${item.count})`).join(", ")}
                        </td>
                        <td>{formatPrice((order.totalPrice * 4) / 100)}</td>
                        <td>{formatPrice(order.totalPrice)}</td>
                        <td>{formatPrice(commission)}</td>
                        <td>{formatPrice(totalWithCommission)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              order.status === "PENDING" ? "status-pending" :
                              order.status === "COOKING" ? "status-cooking" :
                              order.status === "READY" ? "status-ready" :
                              order.status === "COMPLETED" ? "status-completed" :
                              order.status === "ARCHIVE" ? "status-archive" :
                              "status-default"
                            }`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="actions-column">
                          {order.status !== "ARCHIVE" && (
                            <>
                              <button className="action-button edit" onClick={() => handleEdit(order)}>
                                Tahrirlash
                              </button>
                              <button className="action-button delete" onClick={() => handleDelete(order.id)}>
                                O'chirish
                              </button>
                            </>
                          )}
                          <button className="action-button view" onClick={() => handleView(order)}>
                            Ko'rish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedOrder && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-content">
                <h3>{modalType === "view" ? "Zakaz haqida" : "Zakazni tahrirlash"}</h3>
                <p><b>Zakaz №</b> {selectedOrder.id}</p>
                <p><b>Stol:</b> {tableMap[selectedOrder.tableId] || "N/A"}</p>
                <div>
                  <b>Taomlar:</b>
                  {selectedOrder.orderItems.map((item, index) => (
                    <div
                      key={index}
                      style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-2)" }}
                    >
                      <img
                        src={`https://alikafecrm.uz${item.product?.image}`}
                        alt={item.product?.name}
                        style={{ width: "50px", height: "50px", borderRadius: "var(--radius-md)", marginRight: "var(--space-3)" }}
                      />
                      <span>{item.product.name} ({item.count})</span>
                    </div>
                  ))}
                </div>
                <p><b>Holati:</b> {getStatusText(selectedOrder.status)}</p>
                <p><b>Umumiy narxi:</b> {formatPrice(selectedOrder.totalPrice)}</p>
                <p><b>Komissiya ({commissionRate}%):</b> {formatPrice(selectedOrder.totalPrice * (commissionRate / 100))}</p>
                <p><b>Jami (komissiya bilan):</b> {formatPrice(selectedOrder.totalPrice + selectedOrder.totalPrice * (commissionRate / 100))}</p>

                {modalType === "edit" && (
                  <div style={{ marginBottom: "var(--space-4)" }}>
                    <label>Holatni o'zgartirish:</label>
                    <select
                      className="modal-input"
                      value={selectedOrder.status}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "var(--space-2)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid var(--color-neutral-300)`,
                        marginTop: "var(--space-2)",
                      }}
                    >
                      <option value="PENDING">Navbatda</option>
                      <option value="COOKING">Tayyorlanmoqda</option>
                      <option value="READY">Tayyor</option>
                      <option value="COMPLETED">Mijoz oldida</option>
                      <option value="ARCHIVE">Tugallangan</option>
                    </select>
                    <button
                      className="action-button edit"
                      onClick={async () => {
                        try {
                          await axios.put(`https://alikafecrm.uz/order/${selectedOrder.id}`, { status: selectedOrder.status });
                          alert("Zakaz yangilandi");
                          setSelectedOrder(null);
                          setModalType("");
                          await fetchData();
                        } catch (err) {
                          alert("Xatolik yuz berdi");
                          console.error(err);
                        }
                      }}
                      style={{ marginTop: "var(--space-3)" }}
                    >
                      Saqlash
                    </button>
                  </div>
                )}

                <button className="action-button delete" onClick={() => setSelectedOrder(null)}>
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