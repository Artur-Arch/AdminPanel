import React from 'react';
import './styles/sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, Home, FileText, Users, Coffee, ShoppingBag, Settings, List } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '-12px',
          padding: '10px 0'
        }}>ADMIN</h1>
        <button className="mobile-menu-toggle">
          <Menu size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        <Link to="/AdminPanel" className={`nav-item ${location.pathname === '/AdminPanel' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Administrator paneli</span>
        </Link>
        <Link to="/Asboblar" className={`nav-item ${location.pathname === '/Asboblar' ? 'active' : ''}`}>
          <Users size={20} />
          <span>Asboblar paneli</span>
        </Link>
        <Link to="/ZakazlarTarixi" className={`nav-item ${location.pathname === '/ZakazlarTarixi' ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Zakaz tarixi</span>
        </Link>
        <Link to="/Zakazlar" className={`nav-item ${location.pathname === '/Zakazlar' ? 'active' : ''}`}>
          <ShoppingBag size={20} />
          <span>Zakazlar</span>
        </Link>
        <Link to="/Taomlar" className={`nav-item ${location.pathname === '/Taomlar' ? 'active' : ''}`}>
          <Coffee size={20} />
          <span>Taomlar</span>
        </Link>
        <Link to="/TaomlarSoz" className={`nav-item ${location.pathname === '/TaomlarSoz' ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Taomlar sozlamasi</span>
        </Link>
        <Link to="/Stollar" className={`nav-item ${location.pathname === '/Stollar' ? 'active' : ''}`}>
          <List size={20} />
          <span>Stollar</span>
        </Link>
        <Link to="/Sozlamalar" className={`nav-item ${location.pathname === '/Sozlamalar' ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Sozlamalar</span>
        </Link>
        <Link to="/Chiqish" className={`nav-item logout ${location.pathname === '/Chiqish' ? 'active' : ''}`}>
          <LogOut size={20} />
          <span>Chiqish</span>
        </Link>
      </nav>
    </aside>
  );
}