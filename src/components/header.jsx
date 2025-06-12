import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./styles/header.css";
import axios from "axios";
import { User, ChevronDown } from "lucide-react";

export default function Header() {
  const [commissions, setCommissions] = useState({
    totalCommission: 0,
    dailyCommission: 0,
    last30DaysCommission: 0,
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);

  const commissionRate = useSelector((state) => state.commission.commissionRate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await axios.get("https://alikafecrm.uz/order");
        const orders = ordersResponse.data.map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
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
          const orderAmount =
            order.totalAmount ||
            order.orderItems.reduce(
              (itemSum, item) => itemSum + (item.product?.price || 0) * item.count,
              0
            );
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
            const orderAmount =
              order.totalAmount ||
              order.orderItems.reduce(
                (itemSum, item) => itemSum + (item.product?.price || 0) * item.count,
                0
              );
            return sum + orderAmount * (commissionRate / 100);
          }, 0);

        const last30DaysCommission = orders
          .filter((order) => new Date(order.createdAt) >= thirtyDaysAgo)
          .reduce((sum, order) => {
            if (order.commission) {
              return sum + order.commission;
            }
            const orderAmount =
              order.totalAmount ||
              order.orderItems.reduce(
                (itemSum, item) => itemSum + (item.product?.price || 0) * item.count,
                0
              );
            return sum + orderAmount * (commissionRate / 100);
          }, 0);

        setCommissions({ totalCommission, dailyCommission, last30DaysCommission });
      } catch (error) {
        console.error("Xatolik yuz berdi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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