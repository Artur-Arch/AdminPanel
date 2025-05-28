import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/AdminPanel.css";

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("https://suddocs.uz/order");
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

  const handleView = (order) => {
    setSelectedOrder(order);
    setModalType("view");
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setModalType("edit");
  };

  const handleDelete = async (orderId) => {
    const confirmDelete = window.confirm(
      `Rostdan ham bu zakazni o'chirmoqchimisiz?`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://suddocs.uz/order/${orderId}`);
      alert("Zakaz o'chirildi");

      const res = await axios.get("https://suddocs.uz/order");
      setOrders(res.data);

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setModalType("");
      }
    } catch (error) {
      alert("O'chirishda xatolik yuz berdi");
      console.error("Delete error:", error);
    }
  };

  return (
    <>
      <div>
        <h1 className="text">Administrator paneli</h1>

        <div style={{ backgroundColor: "white", borderRadius: "5px" }}>
          <div>
            <h2 style={{ padding: "10px", marginBottom: "0px" }}>
              Barcha Zakazlar
            </h2>
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
                    <td>{formatPrice((order.totalPrice * 4) / 100)}</td>
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
                            : order.status === "COMPLETED"
                            ? "status-completed"
                            : order.status === "ARCHIVE"
                            ? "status-archive"
                            : "bg-gray-500"
                        }`}
                        style={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "center",
                          height: "100%",
                          fontSize: "14px",
                          fontWeight: "bold",
                          fontFamily: "Roboto, sans-serif",
                        }}
                      >
                        {order.status === "PENDING" ? "Navbatda" : ""}
                        {order.status === "READY" ? "Tayyor" : ""}
                        {order.status === "COOKING" ? "Tayyorlanmoqda" : ""}
                        {order.status === "COMPLETED" ? "Mijoz oldida" : ""}
                        {order.status === "ARCHIVE" ? "Tugallangan" : ""}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="EditBox">
                      {order.status !== "ARCHIVE" && (
                        <>
                          <a
                            className="aEdit edit"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEdit(order);
                            }}
                          >
                            Tahrirlash
                          </a>
                          <a
                            className="aEdit delete"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(order.id);
                            }}
                          >
                            O'chirish
                          </a>
                        </>
                      )}
                      <a
                        className="aEdit view"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleView(order);
                        }}
                      >
                        Ko'rish
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedOrder && (
              <div className="modal-overlay">
                <div
                  className="modal"
                  style={{
                    height: "auto",
                    width: "auto",
                    maxWidth: "600px",
                    padding: "20px",
                  }}
                >
                  <div className="modal-content">
                    <h3>
                      {modalType === "view"
                        ? "Zakaz haqida"
                        : "Zakazni tahrirlash"}
                    </h3>
                    <p>
                      <b>Zakaz №</b> {selectedOrder.id}
                    </p>
                    <p>
                      <b>Stol:</b> {selectedOrder.tableNumber}
                    </p>
                    <p>
                      <b>Taomlar:</b>
                      <br />
                      {selectedOrder.orderItems.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "5px",
                          }}
                        >
                          <img
                            src={`https://suddocs.uz${item.product?.image}`}
                            alt={item.product?.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "5px",
                              marginRight: "10px",
                            }}
                          />
                          <span>
                            {item.product.name} ({item.count})
                          </span>
                        </div>
                      ))}
                    </p>

                    <p>
                      <b>Status:</b> {selectedOrder.status}
                      {selectedOrder.status === "PENDING"
                        ? " (Navbatda)"
                        : selectedOrder.status === "COOKING"
                        ? " (Tayyorlanmoqda)"
                        : selectedOrder.status === "READY"
                        ? " (Tayyor)"
                        : selectedOrder.status === "COMPLETED"
                        ? " (Mijoz oldida)"
                        : selectedOrder.status === "ARCHIVE"
                        ? " (Tugallangan)"
                        : ""}
                    </p>
                    <p>
                      <b>Umumiy narxi:</b>{" "}
                      {formatPrice(selectedOrder.totalPrice)}
                    </p>

                    {modalType === "edit" && (
                      <>
                        <label>Holatni o'zgartirish:</label>
                        <br />
                        <br />
                        <select
                          className="modal-input"
                          style={{
                            width: "10em",
                            marginBottom: "10px",
                            marginRight: "10px",
                          }}
                          value={selectedOrder.status}
                          onChange={(e) =>
                            setSelectedOrder({
                              ...selectedOrder,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="PENDING">Navbatda</option>
                          <option value="COOKING">Tayyorlanmoqda</option>
                          <option value="READY">Tayyor</option>
                          <option value="COMPLETED">Mijoz oldida</option>
                          <option value="ARCHIVE">Tugallangan</option>
                        </select>
                        <button
                          onClick={async () => {
                            try {
                              await axios.put(
                                `https://suddocs.uz/order/${selectedOrder.id}`,
                                {
                                  status: selectedOrder.status,
                                }
                              );
                              alert("Zakaz yangilandi");
                              setSelectedOrder(null);
                              setModalType("");
                              const res = await axios.get(
                                "https://suddocs.uz/order"
                              );
                              setOrders(res.data);
                            } catch (err) {
                              alert("Xatolik yuz berdi");
                              console.error(err);
                            }
                          }}
                          className="modal-buttons1"
                          style={{
                            width: "auto",
                            paddingRight: "15px",
                            paddingLeft: "15px",
                            marginRight: "10px",
                          }}
                        >
                          Saqlash
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedOrder(null)}
                      style={{
                        width: "auto",
                        paddingRight: "20px",
                        paddingLeft: "20px",
                        marginRight: "10px",
                      }}
                      className="modal-buttons2"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
