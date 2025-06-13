import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import {
  Pencil,
  X,
  Printer,
  Package2,
  CircleDot,
  ChefHat,
  Hamburger,
  UserCircle2,
} from "lucide-react";
import Receipt from "../components/Receipt.jsx";
import "./styles/Zakazlar.css";
import axios from "axios";
import { socket } from "../socket.js";

const API_BASE = "https://alikafecrm.uz";
const API_ENDPOINTS = {
  orders: `${API_BASE}/order`,
  categories: `${API_BASE}/category`,
  products: `${API_BASE}/product`,
  tables: `${API_BASE}/tables`,
};

const STATUS_LABELS = {
  PENDING: "Yangi",
  COOKING: "Tayyorlanmoqda",
  READY: "Tayyor",
  COMPLETED: "Mijoz oldida",
  ARCHIVE: "Arxivlangan",
};

const filters = [
  { label: "Barchasi", name: "All", icon: Package2 },
  { label: "Yangi", name: "PENDING", icon: CircleDot },
  { label: "Tayyorlanmoqda", name: "COOKING", icon: ChefHat },
  { label: "Tayyor", name: "READY", icon: Hamburger },
  { label: "Mijoz oldida", name: "COMPLETED", icon: UserCircle2 },
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
    401: "Avtorizatsiya xatosi. Iltimos, qayta kiring.",
    403: "Ruxsat yo‘q. Administrator bilan bog‘laning.",
    404: "Ma’lumot topilmadi.",
    422: "Noto‘g‘ri ma’lumot yuborildi.",
    500: "Server xatosi. Keyinroq urinib ko‘ring.",
  };

  const message =
    error.response?.data?.message ||
    statusMessages[error.response?.status] ||
    defaultMessage;
  return message;
};

const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
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
    error: "",
    showInitialDeleteConfirmModal: false,
    showDeleteConfirmModal: false,
    orderToDelete: null,
    isConnected: socket.connected,
    isSaving: false,
  });

  const commissionRate = useSelector(
    (state) => state.commission?.commissionRate || 0
  );
  const receiptRef = useRef();
  const token = localStorage.getItem("token");
  const processedEvents = useRef(new Set());

  const formatPrice = useCallback((price) => {
    return price
      ? price
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
          .replace(/\.00$/, "")
          .trim() + " so‘m"
      : "0 so‘m";
  }, []);

  const calculateTotalPrice = useCallback((orderItems) => {
    return orderItems.reduce(
      (sum, item) => sum + parseFloat(item.product?.price || 0) * item.count,
      0
    );
  }, []);

  const updateState = useCallback((updates) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      if (updates.orders) {
        newState.orders = [...updates.orders];
      }
      return newState;
    });
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const fetchAllData = useCallback(async () => {
    updateState({ loading: true });
    try {
      const [ordersRes, categoriesRes, productsRes, tablesRes] =
        await Promise.all([
          axios.get(API_ENDPOINTS.orders, createApiRequest(token)),
          axios.get(API_ENDPOINTS.categories, createApiRequest(token)),
          axios.get(API_ENDPOINTS.products, createApiRequest(token)),
          axios.get(API_ENDPOINTS.tables, createApiRequest(token)),
        ]);

      const sanitizedOrders = ordersRes.data.map((order) =>
        deepClone({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        })
      );

      updateState({
        orders: sanitizedOrders,
        categoryList: categoriesRes.data,
        products: productsRes.data,
        tables: tablesRes.data.data || tablesRes.data,
        loading: false,
      });
    } catch (error) {
      const message = handleApiError(
        error,
        "Ma‘lumotlarni yuklashda xatolik yuz berdi."
      );
      alert(message);
      updateState({ loading: false, error: message });
    }
  }, [token]);

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
        const message = handleApiError(
          error,
          "Stol holatini yangilashda xatolik."
        );
        alert(message);
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
        socket.emit("orderUpdated", response.data);
        return response.data.status === "ARCHIVE";
      } catch (error) {
        const message = handleApiError(
          error,
          "Buyurtmani arxivlashda xatolik."
        );
        alert(message);
        throw new Error(`Archive failed`);
      }
    },
    [token]
  );

  const handleCloseAndPrint = useCallback(
    async (order) => {
      if (!order?.id) {
        alert("Buyurtma ma’lumotlari topilmadi.");
        return;
      }
      try {
        updateState({ currentOrder: deepClone(order) });
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!receiptRef.current) {
          console.error("Receipt ref is null");
          alert("Chop etish uchun ma’lumotlar tayyor emas.");
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

  const handleDeleteOrder = useCallback(async (id) => {
    updateState({ showInitialDeleteConfirmModal: true, orderToDelete: id });
  }, []);

  const confirmInitialDelete = useCallback(() => {
    updateState({
      showInitialDeleteConfirmModal: false,
      showDeleteConfirmModal: true,
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
      socket.emit("orderDeleted", { id });
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
      alert("Buyurtma muvaffaqiyatli o‘chirildi!");
    } catch (error) {
      const message = handleApiError(error, "Buyurtmani o‘chirishda xatolik.");
      alert(message);
      if (error.response?.status === 404) {
        const updatedOrders = state.orders.filter((o) => o.id !== id);
        updateState({ orders: updatedOrders });
        if (tableId) {
          const hasOtherOrders = updatedOrders.some(
            (o) => o.tableId === tableId && o.id !== id
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

  const handleEditOrder = useCallback(
    (order) => {
      updateState({
        orders: [...state.orders],
        editingOrder: deepClone({
          ...order,
          orderItems: [...order.orderItems],
        }),
        showEditModal: true,
        newItem: { productId: "", count: 1 },
        error: "",
      });
    },
    [state.orders]
  );

  const handleRemoveItem = useCallback(
    async (itemId) => {
      if (state.isSaving || !state.editingOrder) return;

      try {
        updateState({ isSaving: true, error: "" });
        await axios.delete(
          `${API_ENDPOINTS.orders}/orderItem/${itemId}`,
          createApiRequest(token)
        );

        const response = await axios.get(
          `${API_ENDPOINTS.orders}/${state.editingOrder.id}`,
          createApiRequest(token)
        );

        const updatedOrder = response.data;
        const totalPrice = calculateTotalPrice(updatedOrder.orderItems);

        if (socket.connected) {
          socket.emit("orderUpdated", updatedOrder);
        }

        updateState({
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? { ...updatedOrder, totalPrice } : o
          ),
          editingOrder: {
            ...updatedOrder,
            orderItems: updatedOrder.orderItems,
            totalPrice,
          },
          isSaving: false,
        });

        alert("Taom o‘chirildi!");
      } catch (error) {
        const message = handleApiError(error, "Taomni o‘chirishda xatolik.");
        updateState({
          error: message,
          isSaving: false,
        });
        alert(message);
      }
    },
    [state.editingOrder, state.isSaving, state.orders, calculateTotalPrice, token]
  );

  const closeEditModal = useCallback(() => {
    updateState({
      showEditModal: false,
      editingOrder: null,
      newItem: { productId: "", count: 1 },
      error: "",
      isSaving: false,
    });
  }, []);

  const handleAddItem = useCallback(async () => {
    if (state.isSaving || !state.editingOrder) return;

    const { productId, count } = state.newItem;
    if (!productId || count <= 0) {
      alert("Iltimos, taom tanlang va sonini to‘g‘ri kiriting.");
      return;
    }
    const product = state.products.find((p) => p.id === parseInt(productId));
    if (!product) {
      alert("Tanlangan taom topilmadi.");
      return;
    }

    try {
      updateState({ isSaving: true, error: "" });

      const payload = {
        products: [{ productId: Number(productId), count: Number(count) }],
        tableId: state.editingOrder.tableId,
        userId: state.editingOrder.userId,
        status: state.editingOrder.status,
      };
      const response = await axios.put(
        `${API_ENDPOINTS.orders}/${state.editingOrder.id}`,
        payload,
        createApiRequest(token)
      );

      const updatedOrder = response.data;
      const totalPrice = calculateTotalPrice(updatedOrder.orderItems);

      if (socket.connected) {
        socket.emit("orderUpdated", updatedOrder);
      }

      updateState({
        orders: state.orders.map((o) =>
          o.id === updatedOrder.id ? { ...updatedOrder, totalPrice } : o
        ),
        editingOrder: {
          ...updatedOrder,
          orderItems: updatedOrder.orderItems,
          totalPrice,
        },
        newItem: { productId: "", count: 1 },
        isSaving: false,
      });

      alert("Taom qo‘shildi!");
    } catch (error) {
      const message = handleApiError(error, "Taom qo‘shishda xatolik.");
      updateState({
        error: message,
        isSaving: false,
      });
      alert(message);
    }
  }, [
    state.newItem,
    state.products,
    state.editingOrder,
    state.isSaving,
    state.orders,
    calculateTotalPrice,
    token,
  ]);

  useEffect(() => {
    const handleConnect = () => {
      updateState({ isConnected: true });
    };

    const handleDisconnect = () => {
      updateState({ isConnected: false });
    };

    const handleOrderCreated = (newOrder) => {
      if (!newOrder || !newOrder.id) return;
      const eventKey = `orderCreated:${newOrder.id}:${
        newOrder.createdAt || Date.now()
      }`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);
      setState((prevState) => {
        if (prevState.orders.find((order) => order.id === newOrder.id)) {
          console.log(`Order ${newOrder.id} already exists, ignoring creation`);
          return prevState;
        }
        const sanitizedOrder = {
          ...newOrder,
          orderItems: Array.isArray(newOrder.orderItems)
            ? [...newOrder.orderItems]
            : [],
          table: newOrder.table || { name: "N/A", number: "N/A" },
          createdAt: newOrder.createdAt || new Date().toISOString(),
        };
        return {
          ...prevState,
          orders: [sanitizedOrder, ...prevState.orders],
        };
      });
    };

    const handleOrderUpdated = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder.id) return;
      const eventKey = `orderUpdated:${updatedOrder.id}:${
        updatedOrder.updatedAt || Date.now()
      }`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);
      setState((prevState) => {
        const orderExists = prevState.orders.some(
          (order) => order.id === updatedOrder.id
        );
        if (!orderExists) {
          console.warn(
            `Order ${updatedOrder.id} not found in local state, ignoring update`
          );
          return prevState;
        }
        const updatedOrders = prevState.orders.map((order) =>
          order.id === updatedOrder.id
            ? {
                ...order,
                ...updatedOrder,
                orderItems: Array.isArray(updatedOrder.orderItems)
                  ? [...updatedOrder.orderItems]
                  : order.orderItems,
                table: updatedOrder.table || order.table,
              }
            : order
        );
        return {
          ...prevState,
          orders: updatedOrders,
        };
      });
    };

    const handleOrderDeleted = (data) => {
      const id = data?.id;
      if (!id) return;
      const eventKey = `orderDeleted:${id}:${Date.now()}`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);
      setState((prevState) => {
        const updatedOrders = prevState.orders.filter(
          (order) => order.id !== id
        );
        return {
          ...prevState,
          orders: updatedOrders,
        };
      });
    };

    const handleOrderItemStatusUpdated = (updatedItem) => {
      if (!updatedItem || !updatedItem.id) return;
      const eventKey = `orderItemStatusUpdated:${updatedItem.id}:${
        updatedItem.status
      }:${Date.now()}`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);
      setState((prevState) => {
        const updatedOrders = prevState.orders.map((order) => {
          if (order.orderItems.some((item) => item.id === updatedItem.id)) {
            return {
              ...order,
              orderItems: order.orderItems.map((item) =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
              ),
            };
          }
          return order;
        });
        return {
          ...prevState,
          orders: updatedOrders,
        };
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("orderCreated", handleOrderCreated);
    socket.on("orderUpdated", handleOrderUpdated);
    socket.on("orderDeleted", handleOrderDeleted);
    socket.on("orderItemStatusUpdated", handleOrderItemStatusUpdated);

    fetchAllData();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("orderCreated", handleOrderCreated);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.off("orderDeleted", handleOrderDeleted);
      socket.off("orderItemStatusUpdated", handleOrderItemStatusUpdated);
    };
  }, [fetchAllData]);

  const filteredOrders = useMemo(() => {
    return state.orders
      .filter((order) => order.status !== "ARCHIVE")
      .filter(
        (order) =>
          state.activeFilter === "All" || order.status === state.activeFilter
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.orders, state.activeFilter]);

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
      <div
        style={{
          margin: "0",
          marginTop: "-20px",
        }}
        className={`connection-status ${
          state.isConnected ? "connected" : "disconnected"
        }`}
      >
        <span
          className={`status-dot ${
            state.isConnected ? "connected" : "disconnected"
          }`}
        ></span>
        <span className="status-text">
          {state.isConnected ? "Real vaqtda ulanish faol" : "Oflayn rejimi"}
        </span>
      </div>
      <h3 className="orders-title">Buyurtmalar</h3>

      <div className="orders-container">
        {state.loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Ma’lumotlar yuklanmoqda...</p>
          </div>
        ) : (
          <>
            <div className="order-filters">
              {filters.map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.name}
                    className={`filter-button ${
                      state.activeFilter === filter.name ? "active" : ""
                    }`}
                    onClick={() => updateState({ activeFilter: filter.name })}
                  >
                    <IconComponent size={16} className="icon" />
                    <span>{filter.label}</span>
                    <span className="filter-badge">
                      {getFilterCount(filter.name)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="order-list">
              {filteredOrders.length === 0 ? (
                <div className="no-orders">
                  <p>Ushbu toifada buyurtmalar yo‘q.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const calculatedTotal = calculateTotalPrice(order.orderItems);
                  const commission = calculatedTotal * (commissionRate / 100);
                  const totalWithCommission = calculatedTotal + commission;
                  return (
                    <div className="order-card" key={`order-${order.id}`}>
                      <div className="order-card__header">
                        <div className="order-card__info">
                          <span className="order-card__id">
                            Buyurtma №{order.id}
                          </span>
                          <span className="order-card__table">
                            <strong>{order.table?.name || "Stol"} - </strong>
                            <strong>{order.table?.number || "Yo‘q"}</strong>
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
                            title="O‘chirish"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="order-card__items">
                        {(order.orderItems || []).map((item) => (
                          <div
                            className="order-item"
                            key={`${item.id}-${item.status}`}
                          >
                            <img
                              src={`${API_BASE}${item.product?.image || '/placeholder-food.jpg'}`}
                              alt={item.product?.name || 'Taom'}
                              className="order-item__img"
                              onError={(e) => {
                                e.target.src = '/placeholder-food.jpg';
                              }}
                            />
                            <div className="order-item__info">
                              <p className="order-item__name">
                                {item.product?.name || "Noma’lum taom"}
                              </p>
                              <p className="order-item__count">
                                Soni: <strong>{item.count}</strong>
                              </p>
                              <p className="order-item__price">
                                {formatPrice(item.product?.price || 0)}
                              </p>
                              <p className="order-item__status">
                                Holati:{" "}
                                <strong>
                                  {STATUS_LABELS[item.status] || item.status}
                                </strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-card__body">
                        <div className="order-card__stats">
                          <p>
                            Taomlar soni:{" "}
                            <strong>{order.orderItems?.length || 0}</strong>
                          </p>
                          <p className="order-card__total">
                            Umumiy narx:{" "}
                            <strong>
                              {formatPrice(calculatedTotal)}
                            </strong>
                          </p>
                          <p className="order-card__total">
                            Komissiya ({commissionRate}%):{" "}
                            <strong>{formatPrice(commission)}</strong>
                          </p>
                          <p className="order-card__total">
                            Jami (komissiya bilan):{" "}
                            <strong>{formatPrice(totalWithCommission)}</strong>
                          </p>
                        </div>

                        <div className="order-card__time">
                          <p className="order-card__time-label">
                            Buyurtma vaqti:
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
                            To‘lash va chop etish <Printer size={20} />
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
              {state.isSaving && (
                <p className="saving-message">Saqlanmoqda...</p>
              )}
              <div className="modal__items">
                <h3>Joriy taomlar:</h3>
                {state.editingOrder.orderItems.length ? (
                  <div className="modal__items-list">
                    {state.editingOrder.orderItems.map((item) => (
                      <div
                        className="modal__item"
                        key={item.id || item.productId}
                      >
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
                            {item.product?.name || "Noma’lum taom"}
                          </span>
                          <span className="modal__item-details">
                            Soni: {item.count} |{" "}
                            {formatPrice(item.product?.price || 0)}
                          </span>
                        </div>
                        <button
                          className="modal__item-remove"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={state.isSaving}
                        >
                          O‘chirish
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="modal__empty">Taomlar yo‘q.</p>
                )}
              </div>

              <div className="modal__add-section">
                <h3 className="modal__add-title">Yangi taom qo‘shish:</h3>
                <div className="modal__add-form">
                  <select
                    className="modal__select"
                    value={state.newItem.productId}
                    onChange={(e) =>
                      updateState({
                        newItem: {
                          ...state.newItem,
                          productId: e.target.value,
                        },
                      })
                    }
                    style={{ color: "#000" }}
                    disabled={state.isSaving}
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
                    style={{ color: "#000" }}
                    disabled={state.isSaving}
                  />
                  <button
                    style={{
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      cursor: state.isSaving ? "not-allowed" : "pointer",
                      backgroundColor: state.isSaving ? "#6c757d" : "#007bff",
                    }}
                    className="modal__add-btn"
                    onClick={handleAddItem}
                    disabled={state.isSaving}
                  >
                    Qo‘shish
                  </button>
                </div>
              </div>

              <div className="modal__footer">
                <div className="modal__total">
                  Umumiy narx:{" "}
                  {formatPrice(
                    calculateTotalPrice(state.editingOrder.orderItems)
                  )}
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
        </div>
      )}

      {state.showInitialDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelInitialDelete}>
          <div className="modal1" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Ogohlantirish</h2>
              <button
                className="modal__close-btn"
                onClick={cancelInitialDelete}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal__content">
              <p>Ushbu buyurtmani o‘chirishni xohlaysizmi?</p>
            </div>
            <div className="modal__footer">
              <button
                className="modal__cancel-btn"
                onClick={confirmInitialDelete}
                style={{
                  backgroundColor: "#EF4044",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Ha
              </button>
              <button
                className="modal__cancel-btn"
                onClick={cancelInitialDelete}
                style={{
                  backgroundColor: "#10B981",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                Yo‘q
              </button>
            </div>
          </div>
        </div>
      )}

      {state.showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelDeleteOrder}>
          <div
            className="modal1"
            style={{ backgroundColor: "rgb(172, 172, 172)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2 className="modal__title">Buyurtmani o‘chirish</h2>
              <button className="modal__close-btn" onClick={cancelDeleteOrder}>
                <X size={24} />
              </button>
            </div>
            <div className="modal__content">
              <p>
                Rostdan ham ushbu buyurtmani o‘chirmoqchimisiz? Bu amalni ortga
                qaytarib bo‘lmaydi!
              </p>
            </div>
            <div className="modal__footer">
              <button
                className="modal__cancel-btn"
                onClick={confirmDeleteOrder}
                style={{
                  backgroundColor: "#EF4044",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Ha
              </button>
              <button
                className="modal__cancel-btn"
                onClick={cancelDeleteOrder}
                style={{
                  backgroundColor: "#10B981",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                Yo‘q
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
              ? deepClone({
                  id: state.currentOrder.id || null,
                  orderItems: state.currentOrder.orderItems || [],
                  tableNumber: state.currentOrder.table?.number || "",
                  totalPrice: calculateTotalPrice(state.currentOrder.orderItems),
                  commission:
                    calculateTotalPrice(state.currentOrder.orderItems) * (commissionRate / 100),
                  totalWithCommission:
                    calculateTotalPrice(state.currentOrder.orderItems) +
                    calculateTotalPrice(state.currentOrder.orderItems) * (commissionRate / 100),
                  createdAt: state.currentOrder.createdAt || null,
                })
              : {
                  id: null,
                  orderItems: [],
                  tableNumber: "",
                  totalPrice: 0,
                  commission: 0,
                  totalWithCommission: 0,
                  createdAt: null,
                }
          }
        />
      </div>
    </div>
  );
}