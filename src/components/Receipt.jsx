import React from 'react';

const Receipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const formatPrice = (price) => {
    return price
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      .trim() + " so'm";
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
          padding: 10px 15px; /* Уменьшен с 20px 25px */
          border-radius: 4px; /* Уменьшен с 8px */
        }
        .receipt h2 {
          text-align: center;
          margin-bottom: 5px; /* Уменьшен с 10px */
          color: #333;
          font-size: 12px; /* Уменьшен с 16px */
        }
        .receipt p {
          margin: 3px 0; /* Уменьшен с 5px */
          font-size: 10px; /* Уменьшен с 16px */
        }
        .receipt hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 10px 0; /* Уменьшен с 15px */
        }
        .items {
          list-style: none;
          padding-left: 0;
          font-size: 10px; /* Уменьшен с 15px */
        }
        .items li {
          margin: 2px 0; /* Уменьшен с 4px */
          padding: 1px 0; /* Уменьшен с 2px */
          border-bottom: 1px dashed #eee;
        }
        .thank {
          text-align: center;
          margin-top: 10px; /* Уменьшен с 20px */
          font-weight: bold;
          font-size: 10px; /* Уменьшен с 16px */
        }
      `}</style>
      <div className="receipt" ref={ref}>
        <h2>Choyxona "Navruz"</h2>
        <p><strong>Buyurtma raqami:</strong> {order.id}</p>
        <p><strong>Stol:</strong> {order.tableNumber || 'N/A'}</p>
        <p><strong>Sana:</strong> {new Date(order.createdAt || Date.now()).toLocaleString('uz-UZ', {
          timeZone: 'Asia/Tashkent',
        })}</p>
        <hr />
        <ul className="items">
          {order.orderItems?.map((item, index) => (
            <li key={index}>
              {item.product?.name || 'Noma\'lum taom'} x {item.count} — {formatPrice((item.product?.price || 0) * item.count)}
            </li>
          ))}
        </ul>
        <hr />
        <p>Jami: <strong>{formatPrice(order.totalPrice || 0)}</strong></p>
        <p>Hizmat haqqi: <strong>{formatPrice(order.commission || 0)}</strong></p>
        <p>Jami (komissiya bilan): <strong style={{fontSize: "14px", marginBottom: "5px"}}>{formatPrice(order.totalWithCommission || 0)}</strong></p>
        <p className="thank">Rahmat, biz sizni yana kutamiz!</p>
      </div>
    </div>
  );
});

export default Receipt;