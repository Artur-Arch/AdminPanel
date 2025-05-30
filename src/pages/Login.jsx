import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://109.172.37.41:4000/user", {
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
        });
        console.log("Fetched users:", response.data);
        const customerUser = response.data.find((user) => user.role === "CUSTOMER");
        if (customerUser) {
          setCustomer(customerUser);
        } else {
          setError(true);
          setTimeout(() => setError(false), 3000);
        }
      } catch (err) {
        console.error("Foydalanuvchilarni yuklashda xatolik:", err);
        setError(true);
        setTimeout(() => setError(false), 3000);
      } finally {
        setLoading(false);
        if (!error) setError(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogin = () => {
    if (loading) {
      return;
    }

    if (!customer) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      return;
    }

    if (username === customer.username && password === customer.password) {
      setError(false);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("admin", "true");
      navigate("/");
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Kirish</h2>
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          {error && <p className="error-message">Login yoki parol xato. Iltimos, qayta urining!</p>}
          <input
            className={`modal-input1 ${error ? "error" : ""}`}
            type="text"
            placeholder="Login kiriting"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="password-container">
            <input
              className={`modal-input1 ${error ? "error" : ""}`}
              type={showPassword ? "text" : "password"}
              placeholder="Parol kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="toggle-password"
            >
              {showPassword ? "Yashirish" : "Korsatish"}
            </button>
          </div>
          <button className="modButton" onClick={handleLogin}>
            Kirish
          </button>
        </>
      )}
    </div>
  );
}