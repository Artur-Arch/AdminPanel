import React, { useEffect } from "react";
import { useState } from "react";
import "./styles/Stollar.css";

export default function Stollar() {
  const [stollar, setStollar] = useState([]);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("Barcha");
  const [newStol, setNewStol] = useState({
    name: "",
    number: "",
    status: "Bo'sh",
  });

  useEffect(() => {
    const fetchStollar = async () => {
      try {
        const res = await fetch("/Stollar.json");
        const data = await res.json();
        setStollar(data);
      } catch (error) {
        console.error("Stollarni olishda xato:", error);
      }
    };
    fetchStollar();
  }, [])
  const cat = ["Barcha", "Bo'sh", "Band"];

  const handleAddStol = () => {
    if (!newStol.name || !newStol.number) return;

    const newTable = {
      id: Date.now(),
      ...newStol,
    };

    setStollar([...stollar, newTable]);
    setNewStol({ name: "", number: "", status: "Bo'sh" });
    setModal(false);
  };

  const filteredStollar =
    filter === "Barcha" ? stollar : stollar.filter((s) => s.status === filter);

    const handleDelete = (id) => {
      const updatedStol = stollar.filter(item => item.id !== id);
      setStollar(updatedStol);
    };
    
  return (
    <>
      <h3
        style={{
          marginTop: "-15px",
          marginLeft: "-5px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          marginBottom: "0px",
          fontSize: "25px",
        }}
      >
        Stollar
      </h3>
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
              }}
            >
              +
            </button>
            <h3>Stol qoshish</h3>
          </div>
        </article>

      
          {stollar
            .filter((s) => filter === "Barcha" || s.status === filter)
            .map((s) => (
              <article>
              <div key={s.id} className="stolAddCard">
                <h4 className="main-text">{s.name}</h4>
                <p style={{margin: '0px', marginBottom: '-10px', marginTop: '5px'}}>Raqami: {s.number}</p>
                <p style={{border: '0.1px solid rgb(192, 192, 192)', padding: '5px', borderRadius: '5px', marginTop: '10px'}}>
                  Status: <strong>{s.status}</strong>
                </p>
              <button className="deleteBtn" onClick={() => {if (window.confirm(`"${s.name}" stolni o'chirishni istaysizmi?`)) {
      setStollar((prev) => prev.filter((stol) => stol.id !== s.id));
    }}}>🗑️</button>

                <button
                  className={`status-btn ${
                    s.status === "Bo'sh" ? "free" : "busy"
                  }`}
                  onClick={() =>
                    setStollar((prev) =>
                      prev.map((stol) =>
                        stol.id === s.id
                          ? {
                              ...stol,
                              status:
                                stol.status === "Bo'sh" ? "Band" : "Bo'sh",
                            }
                            : stol
                      )
                    )
                  }
                >
                  {s.status === "Bo'sh" ? "Band qilish" : "Bo'shatish"}
                </button>
              </div>
        </article>
            ))}
      </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-stol">
            <h3 style={{ margin: "3px" }}>Stol qo'shish</h3>
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
              <button className="modal-btn1" onClick={handleAddStol}>Qo'shish</button>
              <button className="modal-btn2" onClick={() => setModal(false)}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
