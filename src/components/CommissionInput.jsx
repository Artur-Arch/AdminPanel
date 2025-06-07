import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCommissionRate } from '../store/commissionSlice';
import './styles/CommissionInput.css';

const CommissionInput = ({ orderAmount }) => {
  const dispatch = useDispatch();
  const commissionRate = useSelector((state) => state.commission.commissionRate);

  useEffect(() => {
    const savedCommission = localStorage.getItem('commissionRate');
    if (savedCommission) {
      dispatch(setCommissionRate(Number(savedCommission)));
    }
  }, [dispatch]);

  const totalAmount = orderAmount + orderAmount * (commissionRate / 100);

  const handleCommissionChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= 100) {
      dispatch(setCommissionRate(value));
      localStorage.setItem('commissionRate', value.toString());
    }
  };

    const formatPrice = useCallback((price) => {
      return price
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        .replace(/\.00$/, "")
        .trim() + " so'm";
    }, []);
  

  return (
    <div className="form-group">
      <label className="form-label">Xizmat haqi komissiyasi (%)</label>
      <input
        style={{ width: '200px', height: '50px', fontSize: '20px' }}
        type="number"
        className="form-control"
        value={commissionRate}
        onChange={handleCommissionChange}
        min="0"
        max="100"
        step="0.1"
        placeholder="Komissiya foizini kiriting"
      />
      <div className="commission-info">
        <p>Namuna buyurtma summasi: {formatPrice(orderAmount.toFixed(2))}</p>
        <p>Komissiya ({commissionRate}%): {formatPrice((orderAmount * (commissionRate / 100)).toFixed(2))}</p>
        <p className="font-bold">Jami summa: {formatPrice(totalAmount.toFixed(2))}</p>
      </div>
    </div>
  );
};

export default CommissionInput;