import React, { useEffect, useState } from "react";
import "./styles/taomlar.css";
import axios from "axios";
import { Clock, ShoppingCart } from "lucide-react";
import ModalBasket from "../components/modal/modal-basket";

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
        setTables(res.data.data);
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
    <section className="content-section">
      <div className="section-header">
        <h2>Menyu</h2>
        <div className="tab-controls">
          <button
            className={view === "menu" ? "tab-button active" : "tab-button"}
            onClick={() => setView("menu")}
          >
            Taomlar menyusi
          </button>
          <button
            className={view === "order" ? "tab-button active" : "tab-button"}
            onClick={() => setView("order")}
          >
            Zakaz yaratish
          </button>
        </div>
      </div>
      {view === "menu" && (
        <div className="menu-grid">
          {loading ? (
            <div className="spinner" />
          ) : (
            taomlar.map((taom) => (
              <div key={taom.id} className="menu-card">
                <div className="menu-image">
                  <img
                    src={`https://suddocs.uz${taom.image}`}
                    alt={taom.name}
                  />
                </div>
                <div className="menu-details">
                  <h3>{taom.name}</h3>
                  <span className="category">{taom.category?.name}</span>
                  <div className="menu-meta">
                    <span className="prep-time">
                      <Clock size={16} />
                      {taom.date ? `${taom.date} min` : "Vaqti yoq"}
                    </span>
                    <span className="price">{formatPrice(taom.price)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {view === "order" && (
        <>
          <div className="menu-grid">
            {taomlar.map((taom) => (
              <div key={taom.id} className="menu-card">
                <div className="menu-image">
                  <img
                    src={`https://suddocs.uz${taom.image}`}
                    alt={taom.name}
                  />
                </div>
                <div className="menu-details">
                  <h3>{taom.name}</h3>
                  <span className="price">{formatPrice(taom.price)}</span>
                  <div className="menu-meta">
                    <div className="menu-card__controls">
                      <button
                        className="control-btn"
                        onClick={() => removeFromCart(taom)}
                      >
                        -
                      </button>
                      <span className="control-value">
                        {Math.max(
                          cart.find((item) => item.id === taom.id)?.count || 0,
                          0
                        )}
                      </span>
                      <button
                        className="control-btn"
                        onClick={() => addToCart(taom)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className={`basket-btn ${cart.length === 0 ? "hidden" : ""}`}
            disabled={cart.length === 0}
            onClick={() => setShowBasket(true)}
          >
            <span className="basket-count">{cart.length}</span>
            <span className="basket-icon" style={{
              display: "inline-block",
              marginRight: "8px",
              verticalAlign: "middle",
            }}><ShoppingCart size={20} /></span>
            Buyurtma savati
          </button>
          {showBasket && (
            <div className="overlay">
              <div className="basket-modal">
                <h2 style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: "#333",
                  fontSize: "24px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginTop: "-15px",
                  paddingBottom: "20px",
                }}>Buyurtma</h2>
                {cart.length === 0 ? (
                  <p>Hozircha buyurtma yo'q</p>
                ) : (
                  <table className="basket-table">
                    <thead>
                      <tr>
                        <th>Nomi</th>
                        <th>Miqdor</th>
                        <th>Narxi</th>
                        <th>Summasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.count}</td>
                          <td>{item.price.toLocaleString("ru-RU")} so'm</td>
                          <td>
                            {(item.price * item.count).toLocaleString("ru-RU")} so'm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="basket-table__total-label">
                          Jami:
                        </td>
                        <td className="basket-table__total">
                          {cart
                            .reduce(
                              (sum, item) => sum + item.price * item.count,
                              0
                            )
                            .toLocaleString("ru-RU")} so'm
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
                <div className="basket-buttons">
                  <button
                    className="basket-buttons__back"
                    onClick={() => setShowBasket(false)}
                  >
                    Orqaga
                  </button>
                  <button
                    className="basket-buttons__confirm"
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
      {successMsg && <div className="success-message">{successMsg}</div>}
    </section>
  );
}