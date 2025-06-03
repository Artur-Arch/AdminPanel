import React, { useState, useEffect } from "react";
import "./styles/ZakazTarixi.css";
import axios from "axios";
import {
  CheckCheck,
  ChefHat,
  Hamburger,
  Package,
  CircleDot,
  UserCircle2,
  Calendar,
  Search,
} from "lucide-react";

const filters = [
  { label: "Barchasi", name: "ALL", icon: Package },
  { label: "Navbatda", name: "PENDING", icon: CircleDot },
  { label: "Tayyorlanmoqda", name: "COOKING", icon: ChefHat },
  { label: "Tayyor", name: "READY", icon: Hamburger },
  { label: "Mijoz Oldida", name: "COMPLETED", icon: UserCircle2 },
  { label: "Tugallangan", name: "ARCHIVE", icon: CheckCheck },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status yangi";
    case "COOKING":
      return "status tayyorlanmoqda";
    case "READY":
      return "status tayyor";
    case "COMPLETED":
      return "status mijoz";
    case "ARCHIVE":
      return "status tugallangan";
    default:
      return "status";
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
        const [ordersResponse, categoriesResponse, tablesResponse] =
          await Promise.all([
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

  const categoryMap = categoryList.reduce(
    (map, category) => ({
      ...map,
      [category.id]: category.name,
    }),
    {}
  );

  const tableMap = tables.reduce(
    (map, table) => ({
      ...map,
      [table.id]: table.number,
    }),
    {}
  );

  const filteredHistory = orders
    .filter((order) => {
      const matchesFilterStatus =
        activeFilter === "ALL" || order.status === activeFilter;
      const matchesSearchInput =
        order.id.toString().includes(searchInput) ||
        tableMap[order.tableId]?.toString().includes(searchInput) ||
        "";
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
    <div className="app-container">
      <header>
        <h1 className="order-history__title">Buyurtmalar Tarixi</h1>
      </header>
      <div className="order-history">
        {loading ? (
          <div className="spinner" />
        ) : (
          <div>
            <div className="controls">
              <div className="search-container">
                <div className="search-input">
                  <Search className="icon" />
                  <input
                    type="number"
                    min="0"
                    placeholder="ID yoki Stol bo'yicha Qidirish..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="date-input">
                  <Calendar className="icon" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Tugash Sanasi"
                  />
                </div>
              </div>
              <div className="filter-buttons">
                {filters.map((filter) => {
                  const IconComponent = filter.icon;
                  return (
                    <button
                      key={filter.name}
                      className={activeFilter === filter.name ? "active" : ""}
                      onClick={() => setActiveFilter(filter.name)}
                    >
                      <IconComponent className="icon" />
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
                <button
                  className="filter-buttons__button latest"
                  onClick={() => setSortAscending(!sortAscending)}
                >
                  {sortAscending ? "↑ Eng Eski" : "↓ Eng Yangi"}
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Stol</th>
                  <th>Turi</th>
                  <th>Taomlar</th>
                  <th>Narxi</th>
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
                    <td className="food-items">
                      {order.orderItems.map((item) => (
                        <span
                          key={item.id}
                        >{`${item.product?.name} (${item.count})`}</span>
                      ))}
                    </td>
                    <td>
                      {order.orderItems
                        .reduce(
                          (total, item) =>
                            total + (item.product?.price || 0) * item.count,
                          0
                        )
                        .toLocaleString()}{" "}
                      so'm
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td className={getStatusClass(order.status)}>
                      {order.status === "PENDING"
                        ? "Navbatda"
                        : order.status === "COOKING"
                        ? "Tayyorlanmoqda"
                        : order.status === "READY"
                        ? "Tayyor"
                        : order.status === "COMPLETED"
                        ? "Mijoz Oldida"
                        : order.status === "ARCHIVE"
                        ? "Tugallangan"
                        : "Noma'lum"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredHistory.length === 0 && (
              <div className="no-results">
                <p>Hech qanday buyurtma topilmadi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
