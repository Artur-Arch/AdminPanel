import React, { useState } from "react";
import "../styles/modalBasket.css";

export default function ModalBasket({
  cart,
  onClose,
  onConfirm,
  tables,
  userId,
}) {
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleConfirm = () => {
    console.log("Введенный номер стола:", tableNumber);
    console.log("Доступные столы:", tables);

    if (orderType === "table") {
      if (!tableNumber) {
        alert("Iltimos, stol raqamini kiriting.");
        return;
      }
      if (!Array.isArray(tables)) {
        console.error("tables не является массивом:", tables);
        alert(
          "Xatolik: Stol ma'lumotlari yuklanmadi. Iltimos, qayta urinib ko'ring."
        );
        return;
      }
      const selectedTable = tables.find(
        (t) => String(t.number) === String(tableNumber)
      );
      if (!selectedTable) {
        alert(
          "Bunday stol mavjud emas. Iltimos, to'g'ri stol raqamini kiriting."
        );
        return;
      }
      if (selectedTable.status === "busy") {
        alert("Bu stol allaqachon band. Iltimos, boshqa stol tanlang.");
        return;
      }
      const orderData = {
        orderType,
        tableId: selectedTable.id,
        phoneNumber: null,
        status: "PENDING",
        userId: userId,
        orderItems: cart.map((item) => ({
          productId: item.id,
          count: item.count,
          product: item,
        })),
        tables,
      };

      console.log("Отправляемые данные:", orderData);
      onConfirm(orderData);
      onClose();
    } else if (orderType === "delivery") {
      if (!phoneNumber) {
        alert("Iltimos, telefon raqam kiriting.");
        return;
      }
      const orderData = {
        orderType,
        tableId: null,
        phoneNumber,
        status: "PENDING",
        userId: userId,
        orderItems: cart.map((item) => ({
          productId: item.id,
          count: item.count,
          product: item,
        })),
        tables,
      };

      console.log("Отправляемые данные:", orderData);
      onConfirm(orderData);
      onClose();
    }
  };

  return (
    <div className="overlay">
      <div className="basket-modal">
        <h2>Buyurtma</h2>
        <ul className="cart-list">
          {cart.map((item) => (
            <li key={item.id} className="cart-item">
              {item.name} — {item.count} × {item.price.toLocaleString("ru-RU")} so'm
            </li>
          ))}
        </ul>
        <div className="order-options">
          <label className="order-option">
            <input
              type="radio"
              name="orderType"
              value="delivery"
              checked={orderType === "delivery"}
              onChange={() => setOrderType("delivery")}
            />
            Yetkazib berish
          </label>
          {orderType === "delivery" && (
            <input
              className="modal-input"
              type="text"
              placeholder="Telefon raqami"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          )}
          <label className="order-option">
            <input
              type="radio"
              name="orderType"
              value="table"
              checked={orderType === "table"}
              onChange={() => setOrderType("table")}
            />
            Stolga
          </label>
          {orderType === "table" && (
            <select
              className="modal-input"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            >
              <option value="">Stol raqamini tanlang</option>
              {tables.map((table) => (
                <option
                  key={table.id}
                  value={table.number}
                  disabled={table.status === "busy"}
                >
                  {table.number}{" "}
                  {table.status === "busy" ? "(Band)" : "(Bo'sh)"}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="total-price">
          Jami: {cart.reduce((sum, item) => sum + item.price * item.count, 0).toLocaleString("ru-RU")} so'm
        </p>
        <div className="basket-buttons">
          <button className="basket-buttons__back" onClick={onClose}>
            Orqaga
          </button>
          <button className="basket-buttons__confirm" onClick={handleConfirm}>
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}