import React, { useState } from "react";
import "../styles/modalBasket.css";

export default function modalBasket({ cart, onClose, onConfirm }) {
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  const handleConfirm = () => {
    if (orderType === "table" && !tableNumber) {
      alert("Iltimos, stol raqamini kiriting.");
      return;
    }

    if (orderType === "delivery" && !tableNumber) {
      alert("Iltimos, telefon raqam kiriting.");
      return;
    }

    const orderData = {
      items: cart,
      type: orderType,
      table: orderType === "table" ? tableNumber : null,
      table: orderType === "delivery" ? tableNumber : null
    };

    onConfirm(orderData);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Buyurtma</h2>
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.name} — {item.count} × {item.price} so'm
            </li>
          ))}
        </ul>

        <div className="order-options">
          <label>
            <input
              type="radio"
              name="orderType"
              value="delivery"
              onChange={() => setOrderType("delivery")}
            />
            Yetkazib berish
          </label><br />
          {orderType === "delivery" && (
            <input
              style={{marginTop: "0px"}}
              className="table-input"
              type="number"
              placeholder="telefon raqami"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          )}
          <br />
          <label>
            <input
              type="radio"
              name="orderType"
              value="table"
              onChange={() => setOrderType("table")}
            />
            Stolga
          </label><br />
          {orderType === "table" && (
            <input
              style={{marginTop: "0px"}}
              className="table-input"
              type="number"
              placeholder="Stol raqami"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-btn2" onClick={onClose}>Orqaga</button>
          <button className="modal-btn1" onClick={handleConfirm}>Tasdiqlash</button>
        </div>
      </div>
    </div>
  );
}
