import React, { useEffect, useState, useContext } from "react";
import "./styles/Stollar.css";
import { TableContext } from "../TableContext.jsx";
import axios from "axios";

export default function Stollar() {
  const context = useContext(TableContext);
  console.log("TableContext in Stollar:", context);
  if (!context) {
    console.error("TableContext не предоставлен.");
    return <div>Ошибка: Контекст столов недоступен</div>;
  }
  const { tables, setTables } = context;

  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("Barcha");
  const [newStol, setNewStol] = useState({
    name: "",
    number: "",
    status: "Bo'sh",
  });
  const [error, setError] = useState(null);

  const API_URL = "https://suddocs.uz/tables";
  const ORDERS_API_URL = "https://suddocs.uz/order";

  const statusMapToBackend = {
    "Bo'sh": "empty",
    Band: "busy",
  };
  const statusMapToFrontend = {
    empty: "Bo'sh",
    busy: "Band",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesResponse, ordersResponse] = await Promise.all([
          axios.get(API_URL),
          axios.get(ORDERS_API_URL),
        ]);

        const orders = ordersResponse.data;
        console.log("Загруженные заказы:", orders);

        if (tablesResponse.data.success) {
          const mappedData = tablesResponse.data.data.map((stol) => {
            const hasActiveOrders = orders.some(
              (order) => order.tableId === stol.id && order.status !== "ARCHIVE"
            );
            const status = hasActiveOrders ? "busy" : "empty";
            return {
              ...stol,
              status: statusMapToFrontend[status] || status,
            };
          });
          console.log("Обновленные столы:", mappedData);
          setTables(mappedData);
        } else {
          setError(tablesResponse.data.message || "Stollarni olishda xato yuz berdi");
        }
      } catch (error) {
        console.error("Ma'lumotlarni olishda xato:", error);
        setError("API bilan bog'lanishda xato");
      }
    };
    fetchData();
  }, [setTables]);

  const cat = ["Barcha", "Bo'sh", "Band"];

  const handleAddStol = async () => {
    if (!newStol.name || !newStol.number) {
      setError("Iltimos, stol nomi va raqamini kiriting");
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        name: newStol.name,
        number: parseInt(newStol.number),
        status: statusMapToBackend[newStol.status],
      });
      if (response.data.success) {
        const newTable = {
          ...response.data.data,
          status: statusMapToFrontend[response.data.data.status] || response.data.data.status,
        };
        setTables((prev) => [...prev, newTable]);
        setNewStol({ name: "", number: "", status: "Bo'sh" });
        setModal(false);
        setError(null);
      } else {
        setError(response.data.message || "Stol qo'shishda xato");
      }
    } catch (error) {
      console.error("Stol qo'shishda xato:", error);
      setError("API bilan bog'lanishda xato");
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newFrontendStatus = currentStatus === "Bo'sh" ? "Band" : "Bo'sh";
    const newBackendStatus = statusMapToBackend[newFrontendStatus];

    try {
      const response = await axios.patch(`${API_URL}/${id}`, {
        status: newBackendStatus,
      });
      if (response.data.success) {
        setTables((prev) =>
          prev.map((stol) =>
            stol.id === id ? { ...stol, status: newFrontendStatus } : stol
          )
        );
      } else {
        setError(response.data.message || "Statusni o'zgartirishda xato");
      }
    } catch (error) {
      console.error("Statusni o'zgartirishda xato:", error);
      setError("API bilan bog'lanishda xato");
      setTables((prev) =>
        prev.map((stol) =>
          stol.id === id ? { ...stol, status: newFrontendStatus } : stol
        )
      );
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" stolni o'chirishni xohlaysizmi?`)) return;

    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        setTables((prev) => prev.filter((stol) => stol.id !== id));
        setError(null);
      } else {
        setError(response.data.message || "Stolni o'chirishda xato");
      }
    } catch (error) {
      console.error("Stolni o'chirishda xato:", error);
      setError("API bilan bog'lanishda xato");
    }
  };

  const filteredStollar =
    filter === "Barcha" ? tables : tables.filter((s) => s.status === filter);

  return (
    <>
      <h3
        style={{
          marginTop: "-15px",
          marginLeft: "-5px",
          fontWeight: "bold",
          marginBottom: "0px",
          fontSize: "25px",
        }}
      >
        Stollar
      </h3>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <div className="stollar">
        <nav className="stolCat menu-categories">
          {cat.map((i) => (
            <button
              key={i}
              className={filter === i ? "main-stolBtn active" : "main-stolBtn"}
              onClick={() => setFilter(i)}
            >
              {i} stollar
            </button>
          ))}
        </nav>

        <div className="stol-container">
          <article>
            <div className="stolAddCard">
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

          {filteredStollar.map((s) => (
            <article key={s.id}>
              <div className="stolAddCard">
                <h4 className="main-text">{s.name}</h4>
                <p style={{ margin: "0px", marginBottom: "-10px", marginTop: "5px" }}>
                  Raqami: {s.number}
                </p>
                <p
                  style={{
                    border: "0.5px solid rgb(192, 192)",
                    padding: "5px",
                    borderRadius: "5px",
                    marginTop: "10px",
                  }}
                >
                  Holati: <strong>{s.status}</strong>
                </p>
                <div className="button-group">
                  <button
                    className="deleteBtn"
                    onClick={() => handleDelete(s.id, s.name)}
                  >
                    🗑️
                  </button>
                  <button
                    className={`status-btn ${s.status === "Bo'sh" ? "free" : "busy"}`}
                    onClick={() => handleStatusChange(s.id, s.status)}
                  >
                    {s.status === "Bo'sh" ? "Band qilish" : "Bo'sh"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-stol">
            <h3 style={{ margin: "3px" }}>Yangi stol qo'shish</h3>
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
              onChange={(e) => setNewStol({ ...newStol, number: e.target.value })}
            />
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
    </>
  );
}