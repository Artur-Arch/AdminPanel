import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/AdminPanel.css";

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://109.172.37.41:4000/order");
        setOrders(res.data);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
      }
    };

    fetchOrders();
  }, []);

    const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm";
  };

  return (
    <>
      <div>
        <h1 className="text">Панель администратора</h1>

        <div style={{ backgroundColor: "white", borderRadius: "5px" }}>
          <div>
            <h2 style={{ padding: "10px", marginBottom: "0px" }}>Barcha Zakazlar</h2>
          </div>
          <div className="orders">
            <table>
              <thead>
                <tr>
                  <th>Zakaz nomeri</th>
                  <th>Stol</th>
                  <th>Taom</th>
                  <th>To'lash turi</th>
                  <th>Soliq</th>
                  <th>Umumiy narxi</th>
                  <th>Holat</th>
                  <th>Sana</th>
                  <th>Bajariladigan ishi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={`${order.id}-${index}`}>
                    <td>№ {order.id}</td>
                      <td>{order.tableNumber}</td>
                    <td>
                      {order.orderItems
                        .map((item) => `${item.product.name} (${item.count})`)
                        .join(", ")}
                    </td>
                    <td>-</td>
                    <td>{formatPrice((order.totalPrice * 4)/100)}</td>
                    <td>{formatPrice(order.totalPrice)}</td>
                    <td>
                    <span
                      className={`status ${
                        order.status === "PENDING"
                          ? "status-waitlist"
                          : order.status === "COOKING"
                          ? "status-kitchen"
                          : order.status === "READY"
                          ? "status-ready"
                          : "bg-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="EditBox">
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        Tahrirlash
                      </a>
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        Ko'rish
                      </a>
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        Tarix
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
