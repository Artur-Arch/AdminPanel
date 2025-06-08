import React from 'react';
import { useSelector } from 'react-redux';

const Receipt = React.forwardRef(({ order }, ref) => {
  const restaurantName = useSelector((state) => state.restaurant.restaurantName);

  if (!order) return null;

  const formatPrice = (price) => {
    return price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      .trim() + ' сум';
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
          padding: 10px 15px;
          border-radius: 4px;
        }
        .receipt h2 {
          text-align: center;
          margin-bottom: 5px;
          color: #333;
          font-size: 12px;
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
          font-weight: bold;
          font-size: 10px;
        }
      `}</style>
      <div className="receipt" ref={ref}>
        <h2>{restaurantName}</h2>
        <p><strong>Номер заказа:</strong> {order.id}</p>
        <p><strong>Стол:</strong> {order.tableNumber || 'N/A'}</p>
        <p><strong>Дата:</strong> {new Date(order.createdAt || Date.now()).toLocaleString('ru-RU', {
          timeZone: 'Asia/Tashkent',
        })}</p>
        <hr />
        <ul className="items">
          {order.orderItems?.map((item, index) => (
            <li key={index}>
              {item.product?.name || 'Неизвестное блюдо'} x {item.count} — {formatPrice((item.product?.price || 0) * item.count)}
            </li>
          ))}
        </ul>
        <hr />
        <p>Итого: <strong>{formatPrice(order.totalPrice || 0)}</strong></p>
        <p>Комиссия: <strong>{formatPrice(order.commission || 0)}</strong></p>
        <p>Итого (с комиссией): <strong style={{ fontSize: '14px', marginBottom: '5px' }}>{formatPrice(order.totalWithCommission || 0)}</strong></p>
        <p className="thank">Спасибо, ждем вас снова!</p>
      </div>
    </div>
  );
});

export default Receipt;