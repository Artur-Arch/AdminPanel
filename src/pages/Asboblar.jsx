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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const dailyOrders = orders.filter(
          (order) =>
            new Date(order.createdAt) >= today &&
            new Date(order.createdAt) <= todayEnd
        );

        const orderCount = dailyOrders.length;
        const totalAmount = dailyOrders.reduce((sum, order) => {
          if (order.totalAmount) {
            return sum + order.totalAmount;
          }
          return (
            sum +
            order.orderItems.reduce(
              (itemSum, item) =>
                itemSum + (item.product?.price || 0) * item.count,
              0
            )
          );
        }, 0);
        const averageCheck = orderCount > 0 ? totalAmount / orderCount : 0;

        setDailyStats({ orderCount, totalAmount, averageCheck });

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
            date: day.toLocaleDateString("uz-UZ", {
              day: "2-digit",
              month: "2-digit",
            }),
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

  const chartData = {
    labels: weeklyStats.map((stat) => stat.date),
    datasets: [
      {
        label: "Buyurtmalar soni",
        data: weeklyStats.map((stat) => stat.orderCount),
        backgroundColor: "rgba(67, 97, 238, 0.2)", // Updated to match --color-primary
        borderColor: "var(--color-primary)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Buyurtmalar soni",
          color: "var(--color-text-primary)",
          font: {
            size: 14,
            family: "var(--font-family)",
          },
        },
        ticks: {
          color: "var(--color-text-secondary)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Sana",
          color: "var(--color-text-primary)",
          font: {
            size: 14,
            family: "var(--font-family)",
          },
        },
        ticks: {
          color: "var(--color-text-secondary)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "var(--color-text-primary)",
          font: {
            size: 12,
            family: "var(--font-family)",
          },
        },
      },
      tooltip: {
        backgroundColor: "var(--color-card-background)",
        titleColor: "var(--color-text-primary)",
        bodyColor: "var(--color-text-primary)",
        borderColor: "var(--color-border)",
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="container">
      <header className="header-asboblar">
        <h1
          style={{
            color: "#ffffff",
            fontSize: "2.5rem",
            marginLeft: "-5px",
          }}
          className="header-title fade-in"
        >
          Asboblar
        </h1>
        <h2 className="header-subtitle fade-in">
          <svg>
            <use xlinkHref="#stats-icon" />
          </svg>
          Statistika
        </h2>
      </header>
      <section className="section daily-stats">
        <h3 className="section-title">
          <svg>
            <use xlinkHref="#calendar-icon" />
          </svg>
          Bugungi kun statistikasi
        </h3>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="stats-cards">
            <div className="stats-card card-hover fade-in">
              <p className="stats-card-title">Buyurtmalar soni</p>
              <h4 className="stats-card-value">{dailyStats.orderCount}</h4>
              <span className="stats-card-unit">ta</span>
            </div>
            <div className="stats-card card-hover fade-in">
              <p className="stats-card-title">Umumiy summa</p>
              <h4 className="stats-card-value">
                {dailyStats.totalAmount.toLocaleString("uz-UZ")}
              </h4>
              <span className="stats-card-unit">so'm</span>
            </div>
            <div className="stats-card card-hover fade-in">
              <p className="stats-card-title">O'rtacha buyurtma miqdori</p>
              <h4 className="stats-card-value">
                {Math.round(dailyStats.averageCheck).toLocaleString("uz-UZ")}
              </h4>
              <span className="stats-card-unit">so'm</span>
            </div>
          </div>
        )}
      </section>
      <section className="section chart-container">
        <h3 className="section-title">
          <svg>
            <use xlinkHref="#chart-icon" />
          </svg>
          Haftalik statistika
        </h3>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="chart">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </section>
    </div>
  );
}
