import React, { useState, useEffect } from "react";
import "./styles/ZakazTarixi.css";

const filters = [
  { label: "Barchasi", key: "All" },
  { label: "Yangi", key: "Dine In" },
  { label: "Tayyorlanmoqda", key: "Take Away" },
  { label: "Tayyor", key: "successful" },
];

const mockHistory = [
  {
    id: "H001",
    table: "02",
    type: "Dine In",
    time: "2025-05-06 12:45",
    status: "Yakunlangan",
  },
  {
    id: "H002",
    table: "01",
    type: "Take Away",
    time: "2024-05-06 13:20",
    status: "Yakunlangan",
  },
  {
    id: "H003",
    table: "04",
    type: "Delivery",
    time: "2025-01-06 13:50",
    status: "Yakunlangan",
  },
];

export default function ZakazTarixi() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredHistory = mockHistory
    .filter((order) => {
      const matchesType = filter === "All" || order.type === filter;
      const matchesSearch =
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.table.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  return (
    <>
      <h2 style={{margin: '0px', marginTop: '-15px', marginLeft: '-5px', fontFamily: 'sans-serif', fontWeight: 'bold'}}>Zakazlar tarixi</h2>
      <div className="zakaz-tarixi-wrapper">
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
              <th>Tip</th>
              <th>Vaqti</th>
              <th>Holati</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.table}</td>
                <td>{order.type}</td>
                <td>{order.time}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
