import React from "react";
import { useEffect, useState } from "react";
import "./styles/AdminPanel.css";

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/AdminPanel.json");
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Buyurtmalarni yuklash xatosi:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <div>
        <h1 className="text">Administrator paneli</h1>

        <div style={{ backgroundColor: "white", borderRadius: "5px" }}>
          <div>
            <h2 style={{ padding: "10px", marginBottom: "0px"  }}>
              Barcha buyurtmalar
            </h2>
          </div>
          <div className="orders">
            <table>
              <thead>
                <tr>
                  <th>Buyurtma raqami</th>
                  <th>Taom</th>
                  <th>Yetkazish turi</th>
                  <th>To'lov turi</th>
                  <th>Jami</th>
                  <th>Soliq</th>
                  <th>Jami (soliq bilan)</th>
                  <th>Holati</th>
                  <th>Platforma</th>
                  <th>Sanasi</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={`${order.ref}-${index}`}>
                    <td>№ {order.ref}</td>
                    <td>{order.item}</td>
                    <td>{order.transType}</td>
                    <td>{order.paymentType}</td>
                    <td>{order.total} so'm</td>
                    <td>{order.tax} so'm</td>
                    <td>{order.totalWithTax} so'm</td>
                    <td>
                      <span className={`status ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.platform}</td>
                    <td>{order.date}</td>
                    <td className="EditBox">
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        Edit
                      </a>
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        View
                      </a>
                      <a
                        className="aEdit"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        History
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
