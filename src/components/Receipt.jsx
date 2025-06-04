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
          padding: 20px 25px;
          border-radius: 8px;
        }
        .receipt h2 {
          text-align: center;
          margin-bottom: 10px;
          color: #333;
        }
        .receipt p {
          margin: 5px 0;
          font-size: 16px;
        }
        .receipt hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 15px 0;
        }
        .items {
          list-style: none;
          padding-left: 0;
          font-size: 15px;
        }
        .items li {
          margin: 4px 0;
          padding: 2px 0;
          border-bottom: 1px dashed #eee;
        }
        .thank {
          text-align: center;
          margin-top: 20px;
          font-weight: bold;
          font-size: 16px;
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
        <p><strong>Jami:</strong> {formatPrice(order.totalPrice || 0)}</p>
        <p><strong>Hizmat haqqi:</strong> {formatPrice(order.commission || 0)}</p>
        <p><strong>Jami (komissiya bilan):</strong> {formatPrice(order.totalWithCommission || 0)}</p>
        <p className="thank">Rahmat, biz sizni yana kutamiz!</p>
      </div>
    </div>
  );
});

export default Receipt;