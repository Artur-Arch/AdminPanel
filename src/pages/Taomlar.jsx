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

  const fetchTaomlar = () => {
    axios.get("http://109.172.37.41:4000/product")
      .then((res) => {
        console.log("Ma'lumot:", res.data);
        setTaomlar(res.data);
      })
      .catch((err) => {
        console.error("Taomlarni olishda xatolik:", err);
      });
  };
  
  
  useEffect(() => {

    if (successMsg) {
    const timer = setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
    return () => clearTimeout(timer);
  }

    fetchTaomlar();
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
            <div className="menu-items">
              {taomlar.map((taom) => (
                <div key={taom.id} className="stolAddCard">
                  <img className="menu-cardIMG" src={taom.image} />
                  <h4
                    style={{
                      margin: "5px 0 0 0",
                      border: "1px solid #fff",
                      padding: "8px 0 5px 0",
                      borderRadius: "5px",
                      width: "auto",
                    }}
                  >
                    {taom.name}
                  </h4>
                  <p style={{ margin: "10px 0 0 0" }}>{taom.category}</p>
                  <div className="time-card" style={{ marginTop: "5px" }}>
                    <img
                      className="cardTime"
                      src="/clock-regular.svg"
                    />
                    <p style={{ fontSize: "13px", margin: "10px 0 8px 0" }}>
                      {taom.time}min
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
                    {taom.price} so'm
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "order" && (
          <>
            <div className="menu-view">
              <div className="menu-items">
                {taomlar.map((taom) => (
                  <div key={taom.id} className="stolAddCard">
                    <img className="menu-cardIMG" src={taom.image} />
                    <h4
                      style={{
                        margin: "5px 0 0 0",
                        border: "1px solid #fff",
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
                      {taom.price} so'm
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
                      {Math.max(cart.find((item) => item.id === taom.id)?.count || 0, 0)}
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
                              )}
                              {" "}so'm
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
            setShowModal(false), setShowBasket(false);
          }}
          onConfirm={(orderData) => {
            console.log("Yangi buyurtma:", orderData);
            setCart([]);
            setSuccessMsg("Buyurtma muvaffaqiyatli yuborildi!");
            setShowModal(false);
          }}
        />
      )}
      {successMsg && <div className="success-msg">{successMsg}</div>}
    </div>
  );
}
