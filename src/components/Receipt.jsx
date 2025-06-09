import React from 'react';
import { useSelector } from 'react-redux';

const Receipt = React.forwardRef(({ order }, ref) => {
  const restaurantName = useSelector((state) => state.restaurant.restaurantName);

  if (!order) return null;

  const formatPrice = (price) => {
    return price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      .trim() + ' so\'m';
  };

  return (
    <div>
      <style>{`
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        .receipt {
          max-width: 500px;
          margin: auto;
          background: white;
          padding: 30px 15px;
          border-radius: 4px;
        }
        .receipt h2 {
          text-align: center;
          margin-bottom: 5px;
          color: #333;
          font-size: 20px;
        }
        .receipt p {
          margin: 3px 0;
          font-size: 10px;
        }
        .receipt hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 10px 0;
        }
        .items {
          list-style: none;
          padding-left: 0;
          font-size: 10px;
        }
        .items li {
          margin: 2px 0;
          padding: 1px 0;
          border-bottom: 1px dashed #eee;
        }
        .thank {
          text-align: center;
          margin-top: 10px;
          margin-bottom: 50px
          font-weight: bold;
          font-size: 10px;
        }
      `}</style>
      <div className="receipt" ref={ref}>
        <h2>{restaurantName}</h2>
        <p><strong>Buyurtma raqami:</strong> {order.id}</p>
        <p><strong>Stol:</strong> {order.tableNumber || 'N/A'}</p>
        <p><strong>Sana:</strong> {new Date(order.createdAt || Date.now()).toLocaleString('uz-UZ', {
          timeZone: 'Asia/Tashkent',
        })}</p>
        <hr />
        <ul className="items">
          {order.orderItems?.map((item, index) => (
            <li key={index}>
              {item.product?.name || "Noma'lum taom"} x {item.count} — {formatPrice((item.product?.price || 0) * item.count)}
            </li>
          ))}
        </ul>
        <hr />
        <p>Jami: <strong>{formatPrice(order.totalPrice || 0)}</strong></p>
        <p>Komissiya: <strong>{formatPrice(order.commission || 0)}</strong></p>
        <p>Umumiy tolov: <strong style={{ fontSize: '12px', marginBottom: '5px' }}>{formatPrice(order.totalWithCommission || 0)}</strong></p>
        <p className="thank">Rahmat, yana kutamiz!</p>
        <p>.</p>
      </div>
    </div>
  );
});

export default Receipt;