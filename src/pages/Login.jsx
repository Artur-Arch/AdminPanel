import React from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    navigate("/");
  };

  return (
    <>
    <div style={{ backgroundColor: 'rgb(162, 163, 172)', border: '1px solid rgb(102, 102, 102)', borderRadius: '8px', padding: 40, display: 'flex', marginLeft: '350px', justifyContent: 'center', gap: '20px', alignItems: 'center', flexDirection: 'column', width:'40%' }}>
      <h2>Kirish</h2>
      <input className="modal-input" style={{height: 'auto', width: 'auto'}} type="text" placeholder="Login kiriing" />
      <input className="modal-input" style={{height: 'auto', width: 'auto'}} type="password" placeholder="Parol kiriing" />
      <button className="CatButton" style={{width: '8em', height: '2.5em'}} onClick={handleLogin}>Kirish</button>
    </div>
    </>
  );
}
