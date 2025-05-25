import React, { useState, useEffect } from "react";
import "./styles/ZakazTarixi.css";
import axios from "axios";

const filters = [
  { label: "Barchasi", key: "All" },
  { label: "Yangi", key: "PENDING" },
  { label: "Navbatda", key: "COOKING" },
  { label: "Tayyor", key: "READY" },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status-waitlist";
    case "COOKING":
      return "status-kitchen";
    case "READY":
      return "status-ready";
    default:
      return "bg-gray-500";
  }
};

export default function ZakazTarixi() {
  const [orders, setOrders] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, categoriesResponse] = await Promise.all([
          axios.get("http://109.172.37.41:4000/order"),
          axios.get("http://109.172.37.41:4000/category"),
        ]);

        const sanitizedOrders = ordersResponse.data.map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));

        setOrders(sanitizedOrders);
        setCategoryList(categoriesResponse.data);
      } catch (error) {
        console.error("Xatolik yuz berdi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Move categoryMap inside the component and create it after categoryList is available
  const categoryMap = categoryList.reduce((map, category) => {
    map[category.id] = category.name;
    return map;
  }, {});

  const filteredHistory = orders
    .filter((order) => {
      const matchesFilter = filter === "All" || order.status === filter;
      const matchesSearch =
        order.id.toString().includes(search) ||
        order.tableNumber.toString().includes(search);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  return (
    <>
      <h2
        style={{
          margin: "0px",
          marginTop: "-15px",
          marginLeft: "-5px",
          fontFamily: "sans-serif",
          fontWeight: "bold",
        }}
      >
        Zakazlar tarixi
      </h2>
      <div className="zakaz-tarixi-wrapper">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div>
            <div className="filter-search">
              <input
                className="search-input"
                type="number"
                min="0"
                placeholder="Qidiruv (ID yoki Stol)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="btn-box filters">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    className={filter === f.key ? "active" : ""}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="sort-btn"
                  style={{ marginLeft: "10px" }}
                >
                  {sortAsc ? "⬆️ Eng eski" : "⬇️ Eng yangi"}
                </button>
              </div>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Stol</th>
                  <th>Turi</th>
                  <th>Taomlar va Kategoriyalar</th>
                  <th>Vaqti</th>
                  <th>Holati</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.tableNumber}</td>
                    <td>Dine In</td>
                    <td>
                      {order.orderItems
                        .map(
                          (item) =>
                            `${item.product?.name}  (${item.count})`
                        )
                        .join(", ")}
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td className={getStatusClass(order.status)}>
                      {order.status === "PENDING"
                        ? "Yangi"
                        : order.status === "COOKING"
                        ? "Navbatda"
                        : order.status === "READY"
                        ? "Tayyor"
                        : order.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
