import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Chiqish() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <h2
        style={{
          margin: "0",
          marginTop: "-15px",
          marginLeft: "-5px",
          fontSize: "25px",
          fontFamily: "sans-serif",
        }}
      >
        Chiqish
      </h2>
      <div style={{ padding: "20px" }}>
        <p
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              fontFamily: "Arial, sans-serif",
            }}>Sessiyani yakunlash uchun quyidagi tugmani bosing:</p>
        <button
          onClick={openModal}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Chiqish
        </button>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <p
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              fontFamily: "Arial, sans-serif",
            }}>Tizimdan chiqishni hohlaysizmi?</p>
            <button
              onClick={handleLogout}
              style={{
                marginRight: "10px",
                padding: "10px 15px",
                backgroundColor: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Ha, chiqish
            </button>
            <button
              onClick={closeModal}
              style={{
                padding: "10px 15px",
                backgroundColor: "#ccc",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
