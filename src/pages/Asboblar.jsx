import React, { useState, useEffect } from "react";
import "./styles/Asboblar.css";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Регистрируем компоненты Chart.js
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Asboblar() {
  const [dailyStats, setDailyStats] = useState({
    orderCount: 0,
    totalAmount: 0,
    averageCheck: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await axios.get("https://suddocs.uz/order");
        const orders = ordersResponse.data.map((order) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));

        // Текущая дата и начало текущего дня
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Фильтрация заказов за сегодня
        const dailyOrders = orders.filter(
          (order) =>
            new Date(order.createdAt) >= today &&
            new Date(order.createdAt) <= todayEnd
        );

        // Вычисление ежедневной статистики
        const orderCount = dailyOrders.length;
        const totalAmount = dailyOrders.reduce((sum, order) => {
          if (order.totalAmount) {
            return sum + order.totalAmount;
          }
          return (
            sum +
            order.orderItems.reduce(
              (itemSum, item) => itemSum + (item.product?.price || 0) * item.count,
              0
            )
          );
        }, 0);
        const averageCheck = orderCount > 0 ? totalAmount / orderCount : 0;

        setDailyStats({ orderCount, totalAmount, averageCheck });

        // Вычисление еженедельной статистики (за последние 7 дней)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 6);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(oneWeekAgo);
          day.setDate(oneWeekAgo.getDate() + i);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          const dayOrders = orders.filter(
            (order) =>
              new Date(order.createdAt) >= day &&
              new Date(order.createdAt) <= dayEnd
          );

          weeklyData.push({
            date: day.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }),
            orderCount: dayOrders.length,
          });
        }

        setWeeklyStats(weeklyData);
      } catch (error) {
        console.error("Xatolik yuz berdi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Подготовка данных для графика
  const chartData = {
    labels: weeklyStats.map((stat) => stat.date),
    datasets: [
      {
        label: "Buyurtmalar soni",
        data: weeklyStats.map((stat) => stat.orderCount),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Buyurtmalar soni",
        },
      },
      x: {
        title: {
          display: true,
          text: "Sana",
        },
      },
    },
  };

  return (
    <>
      <h3
        style={{
          margin: "0",
          marginTop: "-15px",
          marginLeft: "-5px",
          fontSize: "25px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
        }}
      >
        Asboblar
      </h3>
      <div className="asboblar">
        <h2 style={{ margin: "0" }}>📊 Statistika</h2>
        <section className="daily-stats">
          <h3>📅 Bugungi kun statistikasi</h3>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="stats-cards">
              <div className="stat-card">
                <p>Buyurtmalar soni</p>
                <h4>{dailyStats.orderCount}</h4>
              </div>
              <div className="stat-card">
                <p>Umumiy summa</p>
                <h4>{dailyStats.totalAmount.toLocaleString("uz-UZ")} so'm</h4>
              </div>
              <div className="stat-card">
                <p>kuniga o'rtacha buyurtma miqdori</p>
                <h4>{Math.round(dailyStats.averageCheck).toLocaleString("uz-UZ")} so'm</h4>
              </div>
            </div>
          )}
        </section>
        <section className="weekly-stats">
          <h3>📈 Haftalik statistika</h3>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="chart-placeholder">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}