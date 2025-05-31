import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "../components/Receipt.jsx";
import "./styles/Zakazlar.css";
import axios from "axios";

const filters = [
  { label: "Barchasi", name: "All" },
  { label: "Navbatda", name: "PENDING" },
  { label: "Tayyor", name: "READY" },
  { label: "Tayyorlanmoqda", name: "COOKING" },
  { label: "Mijoz oldida", name: "COMPLETED" },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status--pending";
    case "COOKING":
      return "status--cooking";
    case "READY":
      return "status--ready";
    case "COMPLETED":
      return "status--completed";
    case "ARCHIVE":
      return "status--archive";
    default:
      return "";
  }
};

export default function Zakazlar() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newItem, setNewItem] = useState({ productId: "", count: 1 });

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const handleCloseAndPrint = async (order) => {
    if (!order || !order.id) {
      console.error("Order yoki order.id mavjud emas:", order);
      alert("Buyurtma ma'lumotlari topilmadi. Qayta urinib ko'ring.");
      return;
    }

    try {
      console.log(`Buyurtma #${order.id} tekshirilmoqda`);
      const checkResponse = await axios.get(`https://suddocs.uz/order/${order.id}`);
      const response = await axios.patch(
        `https://suddocs.uz/order/${order.id}`,
        { status: "ARCHIVE" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("PATCH javobi:", response.data);

      if (response.data.status !== "ARCHIVE") {
        console.warn("Server statusni ARCHIVE ga o'zgartirmadi:", response.data);
        alert("Buyurtma ARCHIVE holatiga o'tkazilmadi. Buyurtma faqat interfeysdan o'chiriladi.");
        setOrders(orders.filter((o) => o.id !== order.id));
      } else {
        setOrders(orders.filter((o) => o.id !== order.id));
      }

      if (receiptRef.current) {
        setCurrentOrder(order);
        setTimeout(() => {
          handlePrint();
          setCurrentOrder(null);
        }, 200);
      } else {
        console.error("receiptRef mavjud emas");
        alert("Chop etishda xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } catch (err) {
      console.error("Statusni ARCHIVE ga o'zgartirishda xatolik:", err.response?.data || err.message);
      if (err.response?.status === 404) {
        alert("Buyurtma topilmadi. Ehtimol, u allaqachon o'chirilgan yoki arxivlangan.");
        setOrders(orders.filter((o) => o.id !== order.id));
      } else if (err.response?.status === 500) {
        alert("Serverda xatolik yuz berdi. Buyurtma faqat interfeysdan o'chiriladi.");
        setOrders(orders.filter((o) => o.id !== order.id));
      } else if (err.response?.status === 401) {
        alert("Avtorizatsiya xatosi. Tokenni tekshiring.");
      } else {
        alert("Buyurtma holatini o'zgartirib bo'lmadi. Qayta urinib ko'ring.");
      }
      if (receiptRef.current) {
        setCurrentOrder(order);
        setTimeout(() => {
          handlePrint();
          setCurrentOrder(null);
        }, 200);
      } else {
        console.error("receiptRef mavjud emas");
        alert("Chop etishda xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Bu buyurtmani o'chirishni xohlaysizmi?")) {
      try {
        console.log("Удаление заказа с ID:", id);
        const order = orders.find((o) => o.id === id);
        console.log("Найденный заказ:", order);
        const tableId = order?.tableId;
        console.log("tableId заказа:", tableId);

        await axios.delete(`https://suddocs.uz/order/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setOrders(orders.filter((order) => order.id !== id));
        alert("Buyurtma muvaffaqiyatli o'chirildi!");

        if (tableId) {
          const hasOtherOrders = orders.some(
            (o) => o.id !== id && o.tableId === tableId && o.status !== "ARCHIVE"
          );
          console.log("Есть другие заказы для стола:", hasOtherOrders);

          if (!hasOtherOrders) {
            try {
              await axios.patch(
                `https://suddocs.uz/tables/${tableId}`,
                { status: "empty" },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                }
              );
              setTables((prev) =>
                prev.map((table) =>
                  table.id === tableId ? { ...table, status: "empty" } : table
                )
              );
              console.log(`Статус стола ${tableId} обновлен на empty на сервере и локально`);
            } catch (err) {
              console.error("Ошибка при обновлении статуса стола:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
              });
              alert("Не удалось обновить статус стола на сервере. Попробуйте снова.");
            }
          }
        }
      } catch (err) {
        console.error("Buyurtmani o'chirishda xatolik:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        if (err.response?.status === 404) {
          alert("Buyurtma topilmadi. Ehtimol, u allaqachon o'chirilgan.");
          setOrders(orders.filter((order) => order.id !== id));
          const order = orders.find((o) => o.id === id);
          const tableId = order?.tableId;
          if (tableId) {
            const hasOtherOrders = orders.some(
              (o) => o.id !== id && o.tableId === tableId && o.status !== "ARCHIVE"
            );
            if (!hasOtherOrders) {
              try {
                await axios.patch(
                  `https://suddocs.uz/tables/${tableId}`,
                  { status: "empty" },
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                  }
                );
                setTables((prev) =>
                  prev.map((table) =>
                    table.id === tableId ? { ...table, status: "empty" } : table
                  )
                );
                console.log(`Статус стола ${tableId} обновлен на empty на сервере и локально (404)`);
              } catch (err) {
                console.error("Ошибка при обновлении статуса стола (404):", {
                  message: err.message,
                  status: err.response?.status,
                  data: err.response?.data,
                });
                alert("Не удалось обновить статус стола на сервере. Попробуйте снова.");
              }
            }
          }
        } else {
          alert("Buyurtmani o'chirib bo'lmadi. Qayta urinib ko'ring.");
        }
      }
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder({
      ...order,
      orderItems: [...order.orderItems],
    });
    setShowEditModal(true);
    setNewItem({ productId: "", count: 1 });
  };

  const handleRemoveItem = (itemId) => {
    console.log("O'chirilayotgan itemId:", itemId, "Turi:", typeof itemId);
    console.log("Joriy orderItems:", editingOrder.orderItems);
    const updatedItems = editingOrder.orderItems.filter((item) => {
      const itemIdStr = String(item.id);
      const targetIdStr = String(itemId);
      return itemIdStr !== targetIdStr;
    });
    console.log("Yangilangan orderItems:", updatedItems);
    setEditingOrder({
      ...editingOrder,
      orderItems: updatedItems,
    });
  };

  const handleAddItem = () => {
    console.log("Yangi taom qo'shish:", newItem);
    if (!newItem.productId || newItem.count <= 0) {
      alert("Iltimos, taom tanlang va sonini 0 dan katta kiriting.");
      return;
    }

    const productId = parseInt(newItem.productId);
    const product = products.find((p) => p.id === productId);
    if (!product) {
      console.error("Taom topilmadi:", newItem.productId);
      alert("Taom topilmadi.");
      return;
    }

    const newOrderItem = {
      id: `temp-${Date.now()}`,
      orderId: editingOrder.id,
      productId: product.id,
      count: newItem.count,
      product: { ...product },
      createdAt: new Date().toISOString(),
    };

    setEditingOrder({
      ...editingOrder,
      orderItems: [...editingOrder.orderItems, newOrderItem],
    });
    setNewItem({ productId: "", count: 1 });
  };

  const handleSaveOrder = async () => {
    if (!editingOrder.orderItems.length) {
      alert("Buyurtma bo'sh bo'lmasligi kerak.");
      return;
    }
    try {
      console.log("Сохранение заказа с ID:", editingOrder.id);
      const totalPrice = editingOrder.orderItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.count,
        0
      );
      const updatedOrder = {
        tableId: editingOrder.tableId,
        status: editingOrder.status,
        userId: editingOrder.userId,
        totalPrice,
        orderItems: editingOrder.orderItems
          .filter((item) => item.productId && item.count > 0)
          .map((item) => ({
            productId: Number(item.productId),
            count: Number(item.count),
          })),
      };
      const response = await axios.put(
        `https://suddocs.uz/order/${editingOrder.id}`,
        updatedOrder,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setOrders(
        orders.map((order) =>
          order.id === editingOrder.id ? { ...editingOrder, totalPrice } : order
        )
      );
      setShowEditModal(false);
      setEditingOrder(null);
      alert("Buyurtma muvaffaqiyatli yangilandi!");
    } catch (err) {
      console.error("Buyurtmani yangilashda xatolik:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 404) {
        alert("Buyurtma topilmadi. Ehtimol, u allaqachon o'chirilgan.");
      } else {
        alert("Buyurtmani yangilab bo'lmadi. Qayta urinib ko'ring.");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, categoriesResponse, productsResponse, tablesResponse] =
          await Promise.all([
            axios.get("https://suddocs.uz/order"),
            axios.get("https://suddocs.uz/category"),
            axios.get("https://suddocs.uz/product"),
            axios.get("https://suddocs.uz/tables"),
          ]);

        const sanitized = ordersResponse.data.map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));
        console.log("Загруженные заказы:", sanitized);
        console.log("Загруженные столы:", tablesResponse.data.data);
        setOrders(sanitized);
        setCategoryList(categoriesResponse.data);
        setProducts(productsResponse.data);
        setTables(tablesResponse.data.data);
      } catch (err) {
        console.error("Ma'lumotlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categoryMap = categoryList.reduce((map, category) => {
    map[category.id] = category.name;
    return map;
  }, {});

  const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm";
  };

  const filteredOrders = orders
    .filter((order) => order.status !== "ARCHIVE")
    .filter((order) => activeFilter === "All" || order.status === activeFilter);
  filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="orders-wrapper">
      <h3 className="orders-title">Zakazlar</h3>

      <div className="orders-container">
        {loading ? (
          <div className="spinner" />
        ) : (
          <div>
            <div className="order-filters">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  className={`filter-button ${activeFilter === filter.name ? "active" : ""}`}
                  onClick={() => setActiveFilter(filter.name)}
                >
                  {filter.label}
                  <span className="filter-badge">
                    {filter.name === "All"
                      ? orders.filter((o) => o.status !== "ARCHIVE").length
                      : orders.filter((o) => o.status === filter.name).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="order-list">
              {filteredOrders.length === 0 ? (
                <p className="no-orders">Bu kategoriya uchun buyurtmalar yo'q.</p>
              ) : (
                filteredOrders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div className="order-card__header">
                      <div className="order-card__info">
                        <span className="order-card__id">Buyurtma №{order.id}</span>
                        <span className="order-card__table">
                          {order.table?.name} - {order.table?.number || "N/A"}
                        </span>
                      </div>
                      <div className="orderCardHeader">
                      <button
                        className="order-card__edit-btn"
                        onClick={() => handleEditOrder(order)}
                      >
                        ✏️
                      </button>
                      <button
                        className="order-card__delete-btn"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        ×
                      </button>
                      </div>
                    </div>

                    <div className="order-card__items">
                      {order.orderItems?.map((item) => (
                        <div className="order-item" key={item.id}>
                          <img
                            src={`https://suddocs.uz${item.product?.image}`}
                            alt={item.product?.name}
                            className="order-item__img"
                          />
                          <div className="order-item__info">
                            <p className="order-item__name">{item.product?.name}</p>
                            <p className="order-item__count">Soni: {item.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card__body">
                      <p>Taomlar soni: {order.orderItems?.length || 0}</p>
                      <p className="order-card__total">Umumiy narxi: {formatPrice(order.totalPrice)}</p>
                      <div className="order-card__time">
                        <p className="order-card__time-label">Buyurtma berilgan vaqti:</p>
                        <p className="order-card__time-value">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      {order.status === "COMPLETED" && (
                        <button
                          className="order-card__print-btn"
                          onClick={() => handleCloseAndPrint(order)}
                        >
                          To'lash va chop etish ✍️
                        </button>
                      )}
                      <div className={`order-card__status ${getStatusClass(order.status)}`}>
                        {order.status === "PENDING" && "Navbatda"}
                        {order.status === "READY" && "Tayyor"}
                        {order.status === "COOKING" && "Tayyorlanmoqda"}
                        {order.status === "COMPLETED" && "Mijoz oldida"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal__title">Buyurtma №{editingOrder?.id} ni tahrirlash</h2>
            <div className="modal__items">
              <h3>Joriy taomlar:</h3>
              {editingOrder?.orderItems.length ? (
                editingOrder.orderItems.map((item) => (
                  <div className="modal__item" key={item.id}>
                    <img
                      src={`https://suddocs.uz${item.product?.image}`}
                      alt={item.product?.name}
                      className="modal__item-img"
                    />
                    <span className="modal__item-name">
                      {item.product?.name} (Soni: {item.count})
                    </span>
                    <button
                      className="modal__item-remove"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                ))
              ) : (
                <p>Taomlar yo'q.</p>
              )}
            </div>

            <h3 className="modal__add-title">Yangi taom qo'shish:</h3>
            <div className="modal__add-form">
              <select
                className="modal__select"
                value={newItem?.productId}
                onChange={(e) =>
                  setNewItem({ ...newItem, productId: e.target.value })
                }
              >
                <option value="">Taom tanlang</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatPrice(product.price)})
                  </option>
                ))}
              </select>
              <input
                className="modal__input"
                type="number"
                min="1"
                value={newItem.count}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    count: parseInt(e.target.value) || 1,
                  })
                }
                placeholder="Soni"
              />
              <button className="modal__add-btn" onClick={handleAddItem}>
                Qo'shish
              </button>
            </div>

            <div className="modal__buttons">
              <button className="modal__save-btn" onClick={handleSaveOrder}>
                Saqlash
              </button>
              <button
                className="modal__close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOrder(null);
                }}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "none" }}>
        <Receipt
          ref={receiptRef}
          order={
            currentOrder || {
              id: null,
              tableNumber: "",
              totalPrice: 0,
              orderItems: [],
            }
          }
        />
      </div>
    </div>
  );
}