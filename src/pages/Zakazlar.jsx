import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { Pencil, X, Printer, Package2, CircleDot, ChefHat, Hamburger, UserCircle2 } from "lucide-react";
import Receipt from "../components/Receipt.jsx";
import "./styles/Zakazlar.css";
import axios from "axios";

const API_BASE = "https://suddocs.uz";
const API_ENDPOINTS = {
  orders: `${API_BASE}/order`,
  categories: `${API_BASE}/category`,
  products: `${API_BASE}/product`,
  tables: `${API_BASE}/tables`,
};

const STATUS_LABELS = {
  PENDING: "Navbatda",
  COOKING: "Tayyorlanmoqda",
  READY: "Tayyor",
  COMPLETED: "Mijoz oldida",
  ARCHIVE: "Arxivlangan",
};

const filters = [
  { label: "Barchasi", name: "All", icon: Package2 },
  { label: "Navbatda", name: "PENDING", icon: CircleDot },
  { label: "Tayyorlanmoqda", name: "COOKING", icon: ChefHat },
  { label: "Tayyor", name: "READY", icon: Hamburger },
  { label: "Mijoz Oldida", name: "COMPLETED", icon: UserCircle2 },
];

const getStatusClass = (status) => {
  const statusClasses = {
    PENDING: "status--pending",
    COOKING: "status--cooking",
    READY: "status--ready",
    COMPLETED: "status--completed",
    ARCHIVE: "status--archive",
  };
  return statusClasses[status] || "";
};

const createApiRequest = (token) => ({
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const handleApiError = (error, defaultMessage) => {
  console.error(defaultMessage, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });

  const statusMessages = {
    401: "Avtorizatsiya xatosi. Qayta login qiling.",
    403: "Ruxsat yo'q. Admin bilan bog'laning.",
    404: "Ma'lumot topilmadi.",
    422: "Noto'g'ri ma'lumot yuborildi.",
    500: "Server xatosi. Keyinroq urinib ko'ring.",
  };

  const message = statusMessages[error.response?.status] || defaultMessage;
  alert(message);
  return error.response?.status;
};

export default function Zakazlar() {
  const [state, setState] = useState({
    activeFilter: "All",
    orders: [],
    categoryList: [],
    products: [],
    tables: [],
    loading: true,
    currentOrder: null,
    showEditModal: false,
    editingOrder: null,
    newItem: { productId: "", count: 1 },
    error: null,
    showInitialDeleteConfirmModal: false, // Новое состояние для первого модального окна
    showDeleteConfirmModal: false, // Состояние для второго модального окна
    orderToDelete: null, // ID заказа для удаления
  });

  const commissionRate = useSelector((state) => state.commission.commissionRate);

  const receiptRef = useRef();
  const token = localStorage.getItem("token");

  const formatPrice = useCallback((price) => {
    return price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      .replace(/\.00$/, "")
      .trim() + " so'm";
  }, []);

  const calculateTotalPrice = useCallback((orderItems) => {
    return orderItems.reduce(
      (sum, item) => sum + parseFloat(item.product?.price || 0) * item.count,
      0
    );
  }, []);

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const fetchAllData = useCallback(async () => {
    updateState({ loading: true });
    try {
      const [ordersRes, categoriesRes, productsRes, tablesRes] = await Promise.all([
        axios.get(API_ENDPOINTS.orders),
        axios.get(API_ENDPOINTS.categories),
        axios.get(API_ENDPOINTS.products),
        axios.get(API_ENDPOINTS.tables),
      ]);

      const sanitizedOrders = ordersRes.data.map((order) => ({
        ...order,
        orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
      }));

      updateState({
        orders: sanitizedOrders,
        categoryList: categoriesRes.data,
        products: productsRes.data,
        tables: tablesRes.data.data || tablesRes.data,
        loading: false,
      });
    } catch (error) {
      handleApiError(error, "Ma'lumotlarni yuklashda xatolik yuz berdi.");
      updateState({ loading: false });
    }
  }, []);

  const updateTableStatus = useCallback(
    async (tableId, status) => {
      if (!tableId) return;
      try {
        await axios.patch(
          `${API_ENDPOINTS.tables}/${tableId}`,
          { status },
          createApiRequest(token)
        );
        updateState({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, status } : table
          ),
        });
      } catch (error) {
        handleApiError(error, "Stol holatini yangilashda xatolik.");
      }
    },
    [state.tables, token]
  );

  const archiveOrder = useCallback(
    async (orderId) => {
      try {
        const response = await axios.put(
          `${API_ENDPOINTS.orders}/${orderId}`,
          { status: "ARCHIVE" },
          createApiRequest(token)
        );
        return response.data.status === "ARCHIVE";
      } catch (error) {
        const status = handleApiError(error, "Buyurtmani arxivlashda xatolik.");
        throw new Error(`Archive failed with status: ${status}`);
      }
    },
    [token]
  );

  const handleCloseAndPrint = useCallback(
    async (order) => {
      if (!order?.id) {
        alert("Buyurtma ma'lumotlari topilmadi.");
        return;
      }
      try {
        updateState({ currentOrder: order });
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!receiptRef.current) {
          console.error("Receipt ref is null");
          alert("Chop etish uchun ma'lumotlar tayyor emas.");
          return;
        }
        await archiveOrder(order.id);
        handlePrint();
        updateState({
          orders: state.orders.filter((o) => o.id !== order.id),
          currentOrder: null,
        });
      } catch (error) {
        console.error("Close and print error:", error);
        alert("Chop etishda xatolik yuz berdi.");
        updateState({
          orders: state.orders.filter((o) => o.id !== order.id),
          currentOrder: null,
        });
      }
    },
    [state.orders, archiveOrder, handlePrint]
  );

  const handleDeleteOrder = useCallback(
    async (id) => {
      // Открываем первое модальное окно
      updateState({ showInitialDeleteConfirmModal: true, orderToDelete: id });
    },
    []
  );

  const confirmInitialDelete = useCallback(() => {
    updateState({
      showInitialDeleteConfirmModal: false,
      showDeleteConfirmModal: true, // Открываем второе модальное окно
    });
  }, []);

  const cancelInitialDelete = useCallback(() => {
    updateState({ showInitialDeleteConfirmModal: false, orderToDelete: null });
  }, []);

  const confirmDeleteOrder = useCallback(async () => {
    const id = state.orderToDelete;
    const order = state.orders.find((o) => o.id === id);
    const tableId = order?.tableId;
    try {
      await axios.delete(
        `${API_ENDPOINTS.orders}/${id}`,
        createApiRequest(token)
      );
      const updatedOrders = state.orders.filter((o) => o.id !== id);
      updateState({ orders: updatedOrders });
      if (tableId) {
        const hasOtherOrders = updatedOrders.some(
          (o) => o.tableId === tableId && o.status !== "ARCHIVE"
        );
        if (!hasOtherOrders) {
          await updateTableStatus(tableId, "empty");
        }
      }
      alert("Buyurtma muvaffaqiyatli o'chirildi!");
    } catch (error) {
      const status = handleApiError(error, "Buyurtmani o'chirishda xatolik.");
      if (status === 404) {
        const updatedOrders = state.orders.filter((o) => o.id !== id);
        updateState({ orders: updatedOrders });
        if (tableId) {
          const hasOtherOrders = updatedOrders.some(
            (o) => o.tableId === tableId && o.status !== "ARCHIVE"
          );
          if (!hasOtherOrders) {
            await updateTableStatus(tableId, "empty");
          }
        }
      }
    } finally {
      updateState({ showDeleteConfirmModal: false, orderToDelete: null });
    }
  }, [state.orders, state.orderToDelete, token, updateTableStatus]);

  const cancelDeleteOrder = useCallback(() => {
    updateState({ showDeleteConfirmModal: false, orderToDelete: null });
  }, []);

  const handleEditOrder = useCallback((order) => {
    updateState({
      editingOrder: {
        ...order,
        orderItems: [...order.orderItems],
      },
      showEditModal: true,
      newItem: { productId: "", count: 1 },
      error: null,
    });
  }, []);

  const handleRemoveItem = useCallback(
    async (itemId) => {
      try {
        const updatedOrderItems = state.editingOrder.orderItems.filter(
          (item) => item.id !== itemId
        );
        const totalPrice = calculateTotalPrice(updatedOrderItems);
        const products = updatedOrderItems.map((item) => ({
          productId: Number(item.productId),
          count: Number(item.count),
        }));

        const payload = {
          products,
          tableId: state.editingOrder.tableId,
          totalPrice,
          userId: state.editingOrder.userId,
        };

        console.log("Sending payload to PUT (remove):", payload);

        const res = await axios.put(
          `${API_BASE}/order/${state.editingOrder.id}`,
          payload,
          createApiRequest(token)
        );
        console.log("PUT response (remove):", res.data);
        const updatedOrder = await axios.get(`${API_BASE}/order/${state.editingOrder.id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        console.log("GET response after PUT (remove):", updatedOrder.data);

        updateState({
          editingOrder: {
            ...state.editingOrder,
            orderItems: updatedOrder.data.orderItems,
            totalPrice: updatedOrder.data.totalPrice,
          },
          orders: state.orders.map((order) =>
            order.id === state.editingOrder.id
              ? { ...order, ...updatedOrder.data, orderItems: updatedOrder.data.orderItems }
              : order
          ),
        });
      } catch (err) {
        console.error("❌ O'chirish xatosi:", err.response?.data || err.message);
        updateState({ error: "Taomni o'chirishda xatolik yuz berdi" });
      }
    },
    [state.editingOrder, state.orders, token, calculateTotalPrice]
  );

  const closeEditModal = useCallback(() => {
    updateState({
      showEditModal: false,
      editingOrder: null,
      newItem: { productId: "", count: 1 },
      error: null,
    });
  }, []);

  const handleAddItem = useCallback(
    async () => {
      const { productId, count } = state.newItem;
      if (!productId || count <= 0) {
        alert("Iltimos, taom tanlang va sonini to'g'ri kiriting.");
        return;
      }
      const product = state.products.find((p) => p.id === parseInt(productId));
      if (!product) {
        alert("Taom topilmadi.");
        return;
      }

      const newOrderItem = {
        productId: Number(product.id),
        count: Number(count),
        product,
      };

      const updatedOrderItems = [...state.editingOrder.orderItems, newOrderItem];
      const totalPrice = calculateTotalPrice(updatedOrderItems);

      const products = updatedOrderItems.map((item) => ({
        productId: Number(item.productId),
        count: Number(item.count),
      }));

      const payload = {
        products,
        tableId: state.editingOrder.tableId,
        totalPrice,
        userId: state.editingOrder.userId,
      };

      console.log("Sending payload to PUT (add):", payload);

      try {
        const res = await axios.put(
          `${API_BASE}/order/${state.editingOrder.id}`,
          payload,
          createApiRequest(token)
        );
        console.log("PUT response (add):", res.data);

        const updatedOrder = await axios.get(`${API_BASE}/order/${state.editingOrder.id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        console.log("GET response after PUT:", updatedOrder.data);

        const newOrderItemsFromServer = updatedOrder.data.orderItems;
        if (!newOrderItemsFromServer.some((item) => item.productId === newOrderItem.productId && item.count === newOrderItem.count)) {
          console.warn("Server did not add new item correctly. Forcing client-side update.");
          updatedOrder.data.orderItems = updatedOrderItems;
        }

        updateState({
          editingOrder: {
            ...state.editingOrder,
            orderItems: updatedOrder.data.orderItems,
            totalPrice: updatedOrder.data.totalPrice,
          },
          orders: state.orders.map((order) =>
            order.id === state.editingOrder.id
              ? { ...order, ...updatedOrder.data, orderItems: updatedOrder.data.orderItems }
              : order
          ),
          newItem: { productId: "", count: 1 },
        });

        closeEditModal();
      } catch (err) {
        console.error("❌ Qo‘shish xatosi:", err.response?.data || err.message);
        updateState({ error: "Taomni qo‘shishda xatolik yuz berdi" });
      }
    },
    [state.newItem, state.products, state.editingOrder, state.orders, token, calculateTotalPrice, closeEditModal]
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredOrders = state.orders
    .filter((order) => order.status !== "ARCHIVE")
    .filter((order) =>
      state.activeFilter === "All" || order.status === state.activeFilter
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getFilterCount = useCallback(
    (filterName) => {
      if (filterName === "All") {
        return state.orders.filter((o) => o.status !== "ARCHIVE").length;
      }
      return state.orders.filter((o) => o.status === filterName).length;
    },
    [state.orders]
  );

  return (
    <div className="orders-wrapper">
      <h3 className="orders-title">Zakazlar</h3>

      <div className="orders-container">
        {state.loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : (
          <>
            <div className="order-filters">
              {filters.map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.name}
                    className={`filter-button ${state.activeFilter === filter.name ? "active" : ""}`}
                    onClick={() => updateState({ activeFilter: filter.name })}
                  >
                    <IconComponent size={16} className="icon" />
                    <span>{filter.label}</span>
                    <span className="filter-badge">{getFilterCount(filter.name)}</span>
                  </button>
                );
              })}
            </div>
            <div className="order-list">
              {filteredOrders.length === 0 ? (
                <div className="no-orders">
                  <p>Bu kategoriya uchun buyurtmalar yo'q.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const commission = order.totalPrice * (commissionRate / 100);
                  const totalWithCommission = order.totalPrice + commission;
                  return (
                    <div className="order-card" key={order.id}>
                      <div className="order-card__header">
                        <div className="order-card__info">
                          <span className="order-card__id">
                            Buyurtma №{order.id}
                          </span>
                          <span className="order-card__table">
                            <strong>{order.table?.name || "Stol"} -{" "}</strong>
                            <strong>{order.table?.number || "N/A"}</strong>
                          </span>
                        </div>
                        <div className="order-card__actions">
                          <button
                            className="order-card__edit-btn"
                            onClick={() => handleEditOrder(order)}
                            title="Tahrirlash"
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            className="order-card__delete-btn"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="O'chirish"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="order-card__items">
                        {order.orderItems?.map((item) => (
                          <div className="order-item" key={item.id}>
                            <img
                              src={`${API_BASE}${item.product?.image || "/placeholder-food.jpg"}`}
                              alt={item.product?.name || "Taom"}
                              className="order-item__img"
                              onError={(e) => {
                                e.target.src = "/placeholder-food.jpg";
                              }}
                            />
                            <div className="order-item__info">
                              <p className="order-item__name">
                                {item.product?.name || "Noma'lum taom"}
                              </p>
                              <p className="order-item__count">
                                Soni: <strong>{item.count}</strong>
                              </p>
                              <p className="order-item__price">
                                {formatPrice(item.product?.price || 0)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-card__body">
                        <div className="order-card__stats">
                          <p>Taomlar soni: <strong>{order.orderItems?.length || 0}</strong></p>
                          <p className="order-card__total">
                            Umumiy narxi: <strong>{formatPrice(order.totalPrice || 0)}</strong>
                          </p>
                          <p className="order-card__total">
                            Komissiya ({commissionRate}%): <strong>{formatPrice(commission)}</strong>
                          </p>
                          <p className="order-card__total">
                            Jami (komissiya bilan): <strong>{formatPrice(totalWithCommission)}</strong>
                          </p>
                        </div>

                        <div className="order-card__time">
                          <p className="order-card__time-label">
                            Buyurtma berilgan vaqti:
                          </p>
                          <p className="order-card__time-value">
                            {new Date(order.createdAt).toLocaleString("uz-UZ", {
                              timeZone: "Asia/Tashkent",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {order.status === "COMPLETED" && (
                          <button
                            className="order-card__print-btn"
                            onClick={() => handleCloseAndPrint(order)}
                          >
                            To'lash va chop etish <Printer size={20} />
                          </button>
                        )}

                        <div
                          className={`order-card__status ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {state.showEditModal && state.editingOrder && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal1" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                Buyurtma №{state.editingOrder.id} ni tahrirlash
              </h2>
              <button className="modal__close-btn" onClick={closeEditModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal__content">
              {state.error && <p className="error-message">{state.error}</p>}
              <div className="modal__items">
                <h3>Joriy taomlar:</h3>
                {state.editingOrder.orderItems.length ? (
                  <div className="modal__items-list">
                    {state.editingOrder.orderItems.map((item) => (
                      <div className="modal__item" key={item.id}>
                        <img
                          src={`${API_BASE}${
                            item.product?.image || "/placeholder-food.jpg"
                          }`}
                          alt={item.product?.name}
                          className="modal__item-img"
                          onError={(e) => {
                            e.target.src = "/placeholder-food.jpg";
                          }}
                        />
                        <div className="modal__item-info">
                          <span className="modal__item-name">
                            {item.product?.name || "Noma'lum taom"}
                          </span>
                          <span className="modal__item-details">
                            Soni: {item.count} |{" "}
                            {formatPrice(item.product?.price || 0)}
                          </span>
                        </div>
                        <button
                          className="modal__item-remove"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          O'chirish
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="modal__empty">Taomlar yo'q.</p>
                )}
              </div>

              <div className="modal__add-section">
                <h3 className="modal__add-title">Yangi taom qo'shish:</h3>
                <div className="modal__add-form">
                  <select
                    className="modal__select"
                    value={state.newItem.productId}
                    onChange={(e) =>
                      updateState({
                        newItem: { ...state.newItem, productId: e.target.value },
                      })
                    }
                  >
                    <option value="">Taom tanlang</option>
                    {state.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({formatPrice(product.price)})
                      </option>
                    ))}
                  </select>
                  <input
                    className="modal__input"
                    type="number"
                    min="1"
                    value={state.newItem.count}
                    onChange={(e) =>
                      updateState({
                        newItem: {
                          ...state.newItem,
                          count: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    placeholder="Soni"
                  />
                  <button
                    style={{
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      cursor: "pointer",
                    }}
                    className="modal__add-btn"
                    onClick={handleAddItem}
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
            </div>

            <div className="modal__footer">
              <div className="modal__total">
                Umumiy narxi:{" "}
                {formatPrice(calculateTotalPrice(state.editingOrder.orderItems))}
              </div>
              <div className="modal__total">
                Komissiya ({commissionRate}%):{" "}
                {formatPrice(
                  calculateTotalPrice(state.editingOrder.orderItems) *
                    (commissionRate / 100)
                )}
              </div>
              <div className="modal__total">
                Jami (komissiya bilan):{" "}
                {formatPrice(
                  calculateTotalPrice(state.editingOrder.orderItems) +
                    calculateTotalPrice(state.editingOrder.orderItems) *
                      (commissionRate / 100)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Первое модальное окно для начального подтверждения */}
      {state.showInitialDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelInitialDelete}>
          <div className="modal1" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Ogohlantirish</h2>
              <button className="modal__close-btn" onClick={cancelInitialDelete}>
                <X size={24} />
              </button>
            </div>
            <div className="modal__content">
              <p>Bu buyurtmani o'chirishni xohlaysizmi?</p>
            </div>
            <div className="modal__footer">
              <button
                className="modal__cancel-btn"
                onClick={confirmInitialDelete}
                style={{ backgroundColor: "#EF4044", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Ha
              </button>
              <button
                className="modal__cancel-btn"
                onClick={cancelInitialDelete}
                style={{ backgroundColor: "#10B981", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "10px" }}
              >
                Yo'q
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Второе модальное окно для окончательного подтверждения */}
      {state.showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelDeleteOrder}>
          <div className="modal1" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Zakaz ochirish</h2>
              <button className="modal__close-btn" onClick={cancelDeleteOrder}>
                <X size={24} />
              </button>
            </div>
            <div className="modal__content">
              <p>Rostdan ham ushbu buyurtmani o'chirishni xohlaysizmi? Bu amal qaytarib bo'lmaydi!</p>
            </div>
            <div className="modal__footer">
              <button
                className="modal__cancel-btn"
                onClick={confirmDeleteOrder}
                style={{ backgroundColor: "#EF4044", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Ha
              </button>
              <button
                className="modal__cancel-btn"
                onClick={cancelDeleteOrder}
                style={{ backgroundColor: "#10B981", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "10px" }}
              >
                Yo'q
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "none" }}>
        <Receipt
          ref={receiptRef}
          order={
            state.currentOrder
              ? {
                  ...state.currentOrder,
                  tableNumber: state.currentOrder.table?.number || "N/A",
                  commission:
                    state.currentOrder.totalPrice * (commissionRate / 100),
                  totalWithCommission:
                    state.currentOrder.totalPrice +
                    state.currentOrder.totalPrice * (commissionRate / 100),
                }
              : {
                  id: null,
                  tableNumber: "",
                  totalPrice: 0,
                  orderItems: [],
                  commission: 0,
                  totalWithCommission: 0,
                }
          }
        />
      </div>
    </div>
  );
}