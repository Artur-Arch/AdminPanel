import React from "react";
import "./styles/Asboblar.css"

export default function Asboblar() {
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
        <h2 style={{margin: '0'}}>📊 Statistika</h2>
        <section className="daily-stats">
          <h3>📅 Bugungi kun statistikasi</h3>
          <div className="stats-cards">
            <div className="stat-card">
              <p>Buyurtmalar soni</p>
              <h4>15</h4>
            </div>
            <div className="stat-card">
              <p>Umumiy summa</p>
              <h4>540 000 so'm</h4>
            </div>
            <div className="stat-card">
              <p>Servis qilingan mijozlar</p>
              <h4>12</h4>
            </div>
          </div>
        </section>
        <section className="weekly-stats">
          <h3>📈 Haftalik statistikasi</h3>
          <div className="chart-placeholder">
            <p>Grafik bu yerda bo'ladi</p>
          </div>
        </section>
      </div>
    </>
  );
}
