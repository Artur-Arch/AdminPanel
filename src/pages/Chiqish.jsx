import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Chiqish() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  useEffect(() => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  }, [navigate]);

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
      Logout
    </h2>
    <div style={{ padding: "20px" }}>
      <h2>Chiqish</h2>
      <p>Sessiyani yakunlash uchun quyidagi tugmani bosing:</p>
      <button
        onClick={handleLogout}
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
    </>
  );
}
