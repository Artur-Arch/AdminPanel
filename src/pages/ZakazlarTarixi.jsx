import React, { useState, useEffect } from "react";
import "./styles/ZakazTarixi.css";
import axios from "axios";

const filters = [
  { label: "Barchasi", name: "ALL" },
  { label: "Yangi", name: "PENDING" },
  { label: "Tayyorlanmoqda", name: "COOKING" },
  { label: "Tayyor", name: "READY" },
  { label: "Mijoz Oldida", name: "COMPLETED" },
  { label: "Tugallangan", name: "ARCHIVE" },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status--pending";
    case "COOKING":
      return "status--cooking";
    case "READY":
      return "status--ready";
    case "COMPLETED":
      return "status--completed";
    case "ARCHIVE":
      return "status--archived";
    default:
      return "status--default";
  }
};

export default function ZakazTarixi() {
  const [orders, setOrders] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortAscending, setSortAscending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, categoriesResponse, tablesResponse] = await Promise.all([
          axios.get("https://suddocs.uz/order"),
          axios.get("https://suddocs.uz/category"),
          axios.get("https://suddocs.uz/tables"),
        ]);

        const sanitizedOrders = ordersResponse.data.map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));

        setOrders(sanitizedOrders);
        setCategoryList(categoriesResponse.data);
        setTables(tablesResponse.data.data || []);
      } catch (error) {
        console.error("Xatolik yuz berdi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categoryMap = categoryList.reduce((map, category) => ({
    ...map,
    [category.id]: category.name,
  }), {});
  
  const tableMap = tables.reduce((map, table) => ({
    ...map,
    [table.id]: table.number,
  }), {});

  const filteredHistory = orders
    .filter((order) => {
      const matchesFilterStatus = activeFilter === "ALL" || order.status === activeFilter;
      const matchesSearchInput = 
        order.id.toString().includes(searchInput) ||
        (tableMap[order.tableId]?.toString().includes(searchInput) || "");
      const orderDate = new Date(order.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDateRange = 
        (!start || orderDate >= start) &&
        (!end || orderDate <= new Date(end).setHours(23, 59, 59, 999));
      return matchesFilterStatus && matchesSearchInput && matchesDateRange;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortAscending ? dateA - dateB : dateB - dateA;
    });

  return (
    <div>
      <h2 className="order-history__title">Buyurtmalar Tarixi</h2>
    <div className="order-history-wrapper">
      {loading ? (
        <div className="spinner" />
      ) : (
        <div>
          <div className="history-filters">
            <div className="history-filters__search">
              <input
                className="history-filters__input"
                type="number"
                min="0"
                placeholder="ID yoki Stol bo'yicha Qidirish..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <input
                className="history-filters__input history-filters__date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Tugash Sanasi"
              />
            </div>
            <div className="history-filters__buttons">
              {filters.map((f) => (
                <button
                  key={f.name}
                  className={`history-filters__button ${activeFilter === f.name ? "active" : ""}`}
                  onClick={() => setActiveFilter(f.name)}
                >
                  {f.label}
                </button>
              ))}
              <button
                className="history-filters__sort-btn"
                onClick={() => setSortAscending(!sortAscending)}
              >
                {sortAscending ? "↑ Eng Eski" : "↓ Eng Yangi"}
              </button>
            </div>
            <br />
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Stol</th>
                <th>Turi</th>
                <th>Taomlar</th>
                <th>Vaqti</th>
                <th>Holati</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{tableMap[order.tableId] || "N/A"}</td>
                  <td>Zalda</td>
                  <td>
                    {order.orderItems
                      .map((item) => `${item.product?.name} (${item.count})`)
                      .join(", ")}
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td className={getStatusClass(order.status)}>
                    {order.status === "PENDING" ? "Yangi" :
                     order.status === "COOKING" ? "Tayyorlanmoqda" :
                     order.status === "READY" ? "Tayyor" :
                     order.status === "COMPLETED" ? "Mijoz Oldida" :
                     order.status === "ARCHIVE" ? "Tugallangan" :
                     "Noma'lum"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}