import React from 'react'

const Receipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const total = order.items?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

    return (
        <div ref={ref} style={{ padding: 20, fontFamily: "Arial" }}>
          <h2>Choyxona "Navruz"</h2>
          <p><strong>Buyurtma raqami:</strong> {order.id}</p>
          <p><strong>Sana:</strong> {new Date().toLocaleString()}</p>
          <hr />
          <ul>
            {order.items?.map((item, index) => (
              <li key={index}>
                {item.name} x {item.quantity} — {item.price * item.quantity} so'm
              </li>
            ))}
          </ul>
          <hr />
          <p><strong>Jami:</strong> {total} so'm</p>
          <p>Rahmat!</p>
        </div>
      );
    });

    export default Receipt;