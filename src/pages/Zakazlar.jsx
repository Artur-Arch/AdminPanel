import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { TableContext } from "../TableContext.jsx";
import Receipt from "../components/Receipt.jsx";
import "./styles/Zakazlar.css";
import axios from "axios";

const filters = [
  { label: "Barchasi", key: "All" },
  { label: "Navbatda", key: "PENDING" },
  { label: "Tayyor", key: "READY" },
  { label: "Tayyorlanmoqda", key: "COOKING" },
  { label: "Mijoz oldida", key: "COMPLETED" },
];

const getStatusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "status-waitlist";
    case "COOKING":
      return "status-kitchen";
    case "READY":
      return "status-ready";
    case "COMPLETED":
      return "status-completed";
    case "ARCHIVE":
      return "status-archive";
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
      const response = await axios.put(
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

const handleDeleteOrder = async (orderId, tableId) => {
    try {
      await axios.delete(`https://suddocs.uz/order/${orderId}`);
      const ordersResponse = await axios.get("https://suddocs.uz/order");
      const orders = ordersResponse.data;
      const hasActiveOrders = orders.some(
        (order) => order.tableId === tableId && order.status !== "ARCHIVE"
      );
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? { ...table, status: hasActiveOrders ? "Band" : "Bo'sh" }
            : table
        )
      );
      console.log(`Статус стола ${tableId} обновлен`);
    } catch (error) {
      console.error("Ошибка удаления заказа:", error);
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
    <div className="zakazlar-wrapper">
      <h3
        style={{
          margin: "0",
          marginLeft: "-20px",
          marginTop: "-15px",
          marginBottom: "-15px",
          fontWeight: "bold",
          fontSize: "24px",
        }}
      >
        Zakazlar
      </h3>

      <div className="zakazlar-main">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div>
            <div className="filters">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  className={`filter-btn ${
                    activeFilter === filter.key ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                  <span className="badge">
                    {filter.key === "All"
                      ? orders.filter((o) => o.status !== "ARCHIVE").length
                      : orders.filter((o) => o.status === filter.key).length}
                  </span>
                </button>
              ))}
            </div>

            <div id="order-cards" className="order-cards">
              {filteredOrders.length === 0 ? (
                <p className="no-orders">
                  Bu kategoriya uchun buyurtmalar yo'q.
                </p>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    className={`order-card ${loading ? "loading" : ""}`}
                    key={order.id}
                  >
                    <div className="order-header">
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="order-id">Buyurtma №{order.id}</span>
                        <span className="table-id">
                          {order.table?.name} - {order.table?.number || "N/A"}
                        </span>
                      </div>
                      <button
                        style={{
                          marginRight: "10px",
                          padding: "5px 5px",
                          border: "1px solid #ccc",
                          background: "#f0f0f0",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                        onClick={() => handleEditOrder(order)}
                      >
                        ✏️
                      </button>
                      <button
                        style={{
                          marginLeft: "-35px",
                          paddingTop: "12px",
                          display: "flex",
                          alignItems: "center",
                          border: "0.5px solid rgb(82, 82, 82)",
                          background: "transparent",
                          color: "red",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="order-items">
                      {order.orderItems?.map((item) => (
                        <div className="order-item" key={item.id}>
                          <img
                            src={`https://suddocs.uz${item.product?.image}`}
                            alt={item.product?.name}
                            className="order-item-img"
                          />
                          <div className="order-item-info">
                            <p className="item-name">{item.product?.name}</p>
                            <p className="item-count">Soni: {item.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-body">
                      <p>Taomlar soni: {order.orderItems?.length || 0}</p>
                      <p style={{ fontWeight: "bold", fontSize: "15px" }}>
                        Umumiy narxi: {formatPrice(order.totalPrice)}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          marginTop: "0px",
                          marginBottom: "5px",
                          border: "1px solid #ccc",
                          paddingLeft: "10px",
                          borderRadius: "5px",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: "bold",
                            fontSize: "14px",
                            marginBottom: "0px",
                          }}
                        >
                          Buyurtma berilgan vaqti:
                        </p>
                        <p
                          style={{
                            fontWeight: "bold",
                            fontSize: "16px",
                            marginTop: "3px",
                          }}
                        >
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {order.status === "COMPLETED" && (
                        <button
                          className="print-btn"
                          onClick={() => handleCloseAndPrint(order)}
                        >
                          To'lash va chop etish ✍️
                        </button>
                      )}
                      <div
                        className={`order-footer ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status === "PENDING" ? "Navbatda" : ""}
                        {order.status === "READY" ? "Tayyor" : ""}
                        {order.status === "COOKING" ? "Tayyorlanmoqda" : ""}
                        {order.status === "COMPLETED" ? "Mijoz oldida" : ""}
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
          <div style={{ paddingBottom: "20px" }} className="modal">
            <h2>Buyurtma №{editingOrder?.id} ni tahrirlash</h2>
            <div
              style={{
                border: "1px solid rgb(82, 82, 82)",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              <h3 style={{ marginTop: "0px" }}>Joriy taomlar:</h3>
              {editingOrder?.orderItems.length ? (
                editingOrder.orderItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
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
                      {item.product?.name} (Soni: {item.count})
                    </span>
                    <button
                      style={{
                        color: "red",
                        border: "1px solid red",
                        padding: "5px",
                        cursor: "pointer",
                        marginLeft: "10px",
                      }}
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

            <h3 style={{ marginBottom: "0px" }}>Yangi taom qo'shish:</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <select
                value={newItem?.productId}
                onChange={(e) =>
                  setNewItem({ ...newItem, productId: e.target.value })
                }
                style={{ padding: "5px", width: "200px" }}
              >
                <option value="">Taom tanlang</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatPrice(product.price)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={newItem.count}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    count: parseInt(e.target.value) || 1,
                  })
                }
                style={{ padding: "5px", width: "50px" }}
                placeholder="Soni"
              />
              <button
                onClick={handleAddItem}
                style={{
                  padding: "5px 10px",
                  background: "blue",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Qo'shish
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleSaveOrder}
                style={{
                  padding: "10px 20px",
                  background: "blue",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Saqlash
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOrder(null);
                }}
                style={{
                  padding: "10px 20px",
                  background: "red",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
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