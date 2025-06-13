import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import "./styles/header.css";
import axios from "axios";
import { User, ChevronDown } from "lucide-react";
import { socket } from "../socket.js";

export default function Header() {
  const [commissions, setCommissions] = useState({
    totalCommission: 0,
    dailyCommission: 0,
    last30DaysCommission: 0,
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const commissionRate = useSelector((state) => state.commission.commissionRate);
  const processedEvents = useRef(new Set());

  const calculateTotalPrice = (orderItems) => {
    return orderItems.reduce(
      (sum, item) => sum + parseFloat(item.product?.price || 0) * item.count,
      0
    );
  };

  const calculateCommissions = (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const totalCommission = orders.reduce((sum, order) => {
      if (order.commission) {
        return sum + order.commission;
      }
      const orderAmount = calculateTotalPrice(order.orderItems);
      return sum + orderAmount * (commissionRate / 100);
    }, 0);

    const dailyCommission = orders
      .filter(
        (order) =>
          new Date(order.createdAt) >= today &&
          new Date(order.createdAt) <= todayEnd
      )
      .reduce((sum, order) => {
        if (order.commission) {
          return sum + order.commission;
        }
        const orderAmount = calculateTotalPrice(order.orderItems);
        return sum + orderAmount * (commissionRate / 100);
      }, 0);

    const last30DaysCommission = orders
      .filter((order) => new Date(order.createdAt) >= thirtyDaysAgo)
      .reduce((sum, order) => {
        if (order.commission) {
          return sum + order.commission;
        }
        const orderAmount = calculateTotalPrice(order.orderItems);
        return sum + orderAmount * (commissionRate / 100);
      }, 0);

    return { totalCommission, dailyCommission, last30DaysCommission };
  };

  const fetchData = async () => {
    try {
      const ordersResponse = await axios.get("https://alikafecrm.uz/order");
      const orders = ordersResponse.data.map((order) => ({
        ...order,
        orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        createdAt: order.createdAt || new Date().toISOString(),
      }));

      let usersData = [{ email: "AdminInfo@gmail.com", role: "CUSTOMER" }];
      try {
        const usersResponse = await axios.get("https://alikafecrm.uz/user");
        usersData = usersResponse.data;
      } catch (userError) {
        console.warn("Foydalanuvchilar API'dan olishda xatolik:", userError);
      }

      const customerUsers = usersData.filter((user) => user.role === "CUSTOMER");
      setUsers(customerUsers);
      setSelectedUser(customerUsers.length > 0 ? customerUsers[0].username : "Foydalanuvchi topilmadi");

      const commissionData = calculateCommissions(orders);
      setCommissions(commissionData);
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOrderCreated = (newOrder) => {
      if (!newOrder || !newOrder.id) return;
      const eventKey = `orderCreated:${newOrder.id}:${newOrder.createdAt || Date.now()}`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);

      setCommissions((prev) => {
        const sanitizedOrder = {
          ...newOrder,
          orderItems: Array.isArray(newOrder.orderItems) ? [...newOrder.orderItems] : [],
          createdAt: newOrder.createdAt || new Date().toISOString(),
        };
        const orderAmount = calculateTotalPrice(sanitizedOrder.orderItems);
        const commission = sanitizedOrder.commission || orderAmount * (commissionRate / 100);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const isToday = new Date(sanitizedOrder.createdAt) >= today && new Date(sanitizedOrder.createdAt) <= todayEnd;
        const isLast30Days = new Date(sanitizedOrder.createdAt) >= thirtyDaysAgo;

        return {
          totalCommission: prev.totalCommission + commission,
          dailyCommission: isToday ? prev.dailyCommission + commission : prev.dailyCommission,
          last30DaysCommission: isLast30Days ? prev.last30DaysCommission + commission : prev.last30DaysCommission,
        };
      });
    };

    const handleOrderUpdated = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder.id) return;
      const eventKey = `orderUpdated:${updatedOrder.id}:${updatedOrder.updatedAt || Date.now()}`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);

      setCommissions((prev) => {
        const sanitizedOrder = {
          ...updatedOrder,
          orderItems: Array.isArray(updatedOrder.orderItems) ? [...updatedOrder.orderItems] : [],
          createdAt: updatedOrder.createdAt || new Date().toISOString(),
        };
        const orderAmount = calculateTotalPrice(sanitizedOrder.orderItems);
        const newCommission = sanitizedOrder.commission || orderAmount * (commissionRate / 100);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const isToday = new Date(sanitizedOrder.createdAt) >= today && new Date(sanitizedOrder.createdAt) <= todayEnd;
        const isLast30Days = new Date(sanitizedOrder.createdAt) >= thirtyDaysAgo;

        // Since we don't have the previous commission, we refetch to ensure accuracy
        fetchData();
        return prev; // Return unchanged state to prevent optimistic updates
      });
    };

    const handleOrderDeleted = (data) => {
      const id = data?.id;
      if (!id) return;
      const eventKey = `orderDeleted:${id}:${Date.now()}`;
      if (processedEvents.current.has(eventKey)) return;
      processedEvents.current.add(eventKey);

      // Refetch data to recalculate commissions accurately
      fetchData();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("orderCreated", handleOrderCreated);
    socket.on("orderUpdated", handleOrderUpdated);
    socket.on("orderDeleted", handleOrderDeleted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("orderCreated", handleOrderCreated);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.off("orderDeleted", handleOrderDeleted);
    };
  }, [commissionRate]);

  return (
    <header className="main-header">
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Komissiya jami:</span>
          <span className="stat-value">{loading ? "..." : commissions.totalCommission.toLocaleString("uz-UZ")} so'm</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Bugungi komissiya:</span>
          <span className="stat-value">{loading ? "..." : commissions.dailyCommission.toLocaleString("uz-UZ")} so'm</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Oxirgi 30 kungi komissiya:</span>
          <span className="stat-value">{loading ? "..." : commissions.last30DaysCommission.toLocaleString("uz-UZ")} so'm</span>
        </div>
      </div>
      <div className="user-dropdown">
        <select
          className="dropdown-toggle"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          {users.length > 0 ? (
            users.map((user) => (
              <option key={user.id} value={user.username}>
                {user.username} {user.name ? `(${user.name})` : ""}
              </option>
            ))
          ) : (
            <option>Foydalanuvchi topilmadi</option>
          )}
        </select>
      </div>
    </header>
  );
}