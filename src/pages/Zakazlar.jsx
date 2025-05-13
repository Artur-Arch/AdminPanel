import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "../components/Receipt.jsx";
import "./styles/Zakazlar.css";
import axios from "axios";

const filters = [
  { label: "Barchasi", key: "All" },
  { label: "Navbatda", key: "PENDING" },
  { label: "Tayyor", key: "READY" },
  { label: "Mijoz oldida", key: "DELIVERED" },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status-waitlist";
    case "READY":
      return "status-kitchen";
    case "DELIVERED":
      return "status-ready";
    default:
      return "";
  }
};

export default function Zakazlar() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();
  const [currentOrder, setCurrentOrder] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const handleCloseAndPrint = (order) => {
    setCurrentOrder(order);
    setTimeout(() => {
      handlePrint();
      setCurrentOrder(null);
    }, 200);    
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get("http://109.172.37.41:4000/order");
        const sanitized = data.map((order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
        }));
        console.log(sanitized);
        setOrders(sanitized);
      } catch (err) {
        console.error("Zakazlarni olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
  }, []);

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((order) => order.status === activeFilter);

  return (
    <div className="zakazlar-wrapper">
      <h3
        style={{
          margin: "0",
          marginLeft: "-20px",
          marginTop: "-15px",
          marginBottom: "-15px",
          fontWeight: "bold",
          fontSize: "24px",
        }}
      >
        Zakazlar
      </h3>
      <div className="zakazlar-main">
        <div className="filters">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={`filter-btn ${
                activeFilter === filter.key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
              <span className="badge">
                {filter.key === "All"
                  ? orders.length
                  : orders.filter((o) => o.status === filter.key).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading">Yuklanmoqda...</p>
        ) : (
          <div className="order-cards">
            {filteredOrders.length === 0 ? (
              <p className="no-orders">Bu kategoriya uchun buyurtmalar yo'q.</p>
            ) : (
              filteredOrders.map((order) => (
                <div className="order-card" key={order.id}>
                  <div className="order-header">
                    <span className="order-id">Buyurtma #{order.id}</span>
                    <span className="table-id">Stol {order.tableNumber}</span>
                  </div>
                  <div className="order-body">
                    <p>Taomlar soni: {order.productIds?.length || 0}</p>
                    <p>{ new Date(order.createdAt).toLocaleString()}</p>
                    {order.status === "READY" && (
                    <button
                      className="print-btn"
                      onClick={() => handleCloseAndPrint(order)}
                    >
                      Tolandi va chop etish
                    </button>
                    )}
                  </div>
                  <div className={`order-footer ${getStatusClass(order.status)}`}>
                    {order.status || ""}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div style={{ display: "none" }}>
        {currentOrder && <Receipt ref={receiptRef} order={currentOrder} />}
      </div>
    </div>
  );
}
