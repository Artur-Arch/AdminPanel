import React, { useEffect, useState } from "react";
import ModalBasket from "../components/modal/modal-basket";
import "./styles/Taomlar.css";
import axios from "axios";

export default function Taomlar() {
  const [taomlar, setTaomlar] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("menu");
  const [showModal, setShowModal] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    axios
      .get("https://suddocs.uz/tables")
      .then((res) => {
        console.log("Данные столов:", res.data);
        setTables(res.data.data); // Сохраняем массив столов
      })
      .catch((err) => console.error("Ошибка загрузки столов:", err));
  }, []);

  const fetchTaomlar = () => {
    setLoading(true);
    axios
      .get("https://suddocs.uz/product")
      .then((res) => {
        setTaomlar(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Taomlarni olishda xatolik:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTaomlar();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const time = setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
      return () => clearTimeout(time);
    }
  }, [successMsg]);

  const addToCart = (taom) => {
    setCart((prev) => {
      const foundTaom = prev.find((item) => item.id === taom.id);
      if (foundTaom) {
        return prev.map((item) =>
          item.id === taom.id ? { ...item, count: item.count + 1 } : item
        );
      } else {
        return [...prev, { ...taom, count: 1 }];
      }
    });
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser?.id;

  const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm";
  };

  const removeFromCart = (taom) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.id === taom.id ? { ...item, count: item.count - 1 } : item
        )
        .filter((item) => item.count > 0);
    });
  };

  return (
    <div className="taomlar-wrapper">
      <h2
        style={{
          margin: "0px",
          marginTop: "-15px",
          marginLeft: "-5px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
        }}
      >
        Menyu
      </h2>
      <div className="menu-container">
        <div className="catMenu menu-categories">
          <button
            style={{ fontWeight: "bolder" }}
            className={view === "menu" ? "CatButton active" : "CatButton"}
            onClick={() => setView("menu")}
          >
            Taomlar menyusi
          </button>
          <button
            style={{ fontWeight: "bolder" }}
            className={view === "order" ? "CatButton active" : "CatButton"}
            onClick={() => setView("order")}
          >
            Zakaz yaratish
          </button>
        </div>
        {view === "menu" && (
          <div className="menu-view">
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <div className="menu-items">
                {taomlar.map((taom) => (
                  <div key={taom.id} className="stolAddCard">
                    <img
                      className="menu-cardIMG"
                      src={`https://suddocs.uz${taom.image}`}
                      alt={taom.name}
                    />
                    <h4
                      style={{
                        margin: "5px 0 0 0",
                        padding: "8px 0 5px 0",
                        borderRadius: "5px",
                        width: "auto",
                      }}
                    >
                      {taom.name}
                    </h4>
                    <p style={{ margin: "10px 0 0 0", fontWeight: "normal" }}>
                      {taom.category?.name}
                    </p>
                    <div className="time-card" style={{ marginTop: "5px" }}>
                      <img className="cardTime" src="/clock-regular.svg" />
                      <p style={{ fontSize: "13px", margin: "10px 0 8px 0" }}>
                        {taom.date ? `${taom.date} min` : "Vaqti yoq"}
                      </p>
                    </div>
                    <p
                      style={{
                        margin: "10px 0 0 0",
                        border: "1px solid #fff",
                        padding: "8px 0 0 0px",
                        borderRadius: "5px",
                      }}
                    >
                      {formatPrice(taom.price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "order" && (
          <>
            <div className="menu-view">
              <div className="menu-items">
                {taomlar.map((taom) => (
                  <div key={taom.id} className="stolAddCard">
                    <img
                      className="menu-cardIMG"
                      src={`https://suddocs.uz${taom.image}`}
                      alt={taom.name}
                    />
                    <h4
                      style={{
                        margin: "5px 0 0 0",
                        padding: "8px 0 5px 0",
                        borderRadius: "5px",
                        width: "auto",
                      }}
                    >
                      {taom.name}
                    </h4>
                    <p
                      style={{
                        margin: "10px 0 0 0",
                        border: "1px solid #fff",
                        padding: "8px 0 0 0px",
                        borderRadius: "5px",
                      }}
                    >
                      {formatPrice(taom.price)}
                    </p>
                    <div className="count-controls">
                      <button
                        className="count-btn"
                        style={{ paddingLeft: "10px", paddingRight: "10px" }}
                        onClick={() => removeFromCart(taom)}
                      >
                        -
                      </button>
                      <span className="count-value">
                        {Math.max(
                          cart.find((item) => item.id === taom.id)?.count || 0,
                          0
                        )}
                      </span>
                      <button
                        className="count-btn"
                        style={{
                          paddingTop: "10px",
                          paddingLeft: "8px",
                          paddingRight: "8px",
                        }}
                        onClick={() => addToCart(taom)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className={`show-basket-btn ${cart.length === 0 ? "hidden" : ""}`}
              disabled={cart.length === 0}
              onClick={() => setShowBasket(true)}
            >
              Buyurtma savati
            </button>
            {showBasket && (
              <div className="overley">
                <div className="order-view">
                  <h2>Buyurtma</h2>
                  {cart.length === 0 ? (
                    <p>Hozircha buyurtma yo'q</p>
                  ) : (
                    <table
                      className="modal-table"
                      style={{ width: "100%", marginTop: "10px" }}
                    >
                      <thead style={{ backgroundColor: "rgb(144, 148, 180)" }}>
                        <tr>
                          <th>Nomi</th>
                          <th>Miqdor</th>
                          <th>Narxi</th>
                          <th>Summasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, i) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.count}</td>
                            <td>{item.price.toLocaleString("ru-RU")} so'm</td>
                            <td>
                              {(item.price * item.count).toLocaleString(
                                "ru-RU"
                              )}{" "}
                              so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot style={{ borderTop: "1px solid #fff" }}>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              textAlign: "left",
                              fontWeight: "bold",
                              fontSize: "16px",
                            }}
                          >
                            Jami:
                          </td>
                          <td style={{ fontWeight: "bold" }}>
                            {cart
                              .reduce(
                                (sum, item) => sum + item.price * item.count,
                                0
                              )
                              .toLocaleString("ru-RU")}
                            {""} so'm
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                  <div className="order-buttons">
                    <button
                      className="order-buttons2"
                      onClick={() => setShowBasket(false)}
                    >
                      Orqaga
                    </button>
                    <button
                      className="order-buttons1"
                      disabled={cart.length === 0}
                      onClick={() => setShowModal(true)}
                    >
                      Buyurtmani rasmiylashtirish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {showModal && (
        <ModalBasket
          cart={cart}
          onClose={() => {
            setShowModal(false);
            setShowBasket(false);
          }}
          onConfirm={(orderData) => {
            const products = orderData.orderItems
              .filter((item) => item?.productId && item.count > 0)
              .map((item) => ({
                productId: Number(item.productId),
                count: Number(item.count),
              }));

            const tableId = orderData.orderType === "table" ? orderData.tableId : null;

            const totalPrice = orderData.orderItems.reduce((acc, item) => {
              const price = item?.product?.price
                ? Number(item.product.price)
                : 0;
              return acc + price * item.count;
            }, 0);

            const body = {
              products,
              tableId,
              totalPrice,
              userId: userId || 2,
            };

            if (!tableId && orderData.orderType === "table") {
              alert(
                "Bunday stol mavjud emas. Iltimos, to'g'ri stol raqamini kiriting."
              );
              return;
            }

            console.log(
              "Yuborilayotgan buyurtma:",
              JSON.stringify(body, null, 2)
            );

            axios
              .post("https://suddocs.uz/order", body)
              .then((res) => {
                console.log("Buyurtma yuborildi:", res.data);
                setCart([]);
                setSuccessMsg("Buyurtma muvaffaqiyatli yuborildi!");

                if (orderData.orderType === "table" && tableId) {
                  axios
                    .patch(`https://suddocs.uz/tables/${tableId}`, {
                      status: "busy",
                    })
                    .then((res) => {
                      console.log("Статус стола обновлен:", res.data);
                      setTables((prev) =>
                        prev.map((table) =>
                          table.id === tableId
                            ? { ...table, status: "busy" }
                            : table
                        )
                      );
                    })
                    .catch((err) => {
                      console.error("Ошибка при обновлении статуса стола:", err);
                      if (err.response) {
                        console.log("Status:", err.response.status);
                        console.log("Data:", err.response.data);
                      }
                    });
                }
              })
              .catch((err) => {
                console.error("Xatolik:", err);
                if (err.response) {
                  console.log("Status:", err.response.status);
                  console.log("Data:", err.response.data);
                }
              });
          }}
          tables={tables}
          userId={userId}
        />
      )}

      {successMsg && <div className="success-msg">{successMsg}</div>}
    </div>
  );
}