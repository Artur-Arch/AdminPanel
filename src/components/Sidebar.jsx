import React from 'react';
import './styles/sidebar.css'
import { Link, useLocation } from 'react-router-dom'
export default function Sidebar() {
  const location = useLocation();
  return (
    <>
      <aside className="sidebar">
      <h1 style={{ fontSize: '50px', margin: '5px' }}>ADMIN</h1>
        <nav className="sidebar__nav">
            <ul>
                <li className='dataSidebar'> <Link to="/AdminPanel" className={location.pathname === '/AdminPanel' ? 'active' : ''}>Administrator paneli</Link> </li>
                <li className='dataSidebar'> <Link to="/Asboblar" className={location.pathname === '/Asboblar' ? 'active' : ''}>Asboblar paneli</Link> </li>
                <li className='dataSidebar'> <Link to="/ZakazlarTarixi" className={location.pathname === '/ZakazlarTarixi' ? 'active' : ''}>Zakaz tarixi</Link> </li>
                <li className='dataSidebar'> <Link to="/Zakazlar" className={location.pathname === '/Zakazlar' ? 'active' : ''}>Zakazlar</Link> </li>
                <li className='dataSidebar'> <Link to="/Taomlar" className={location.pathname === '/Taomlar' ? 'active' : ''}>Taomlar</Link> </li>
                <li className='dataSidebar'> <Link to="/TaomlarSoz" className={location.pathname === '/TaomlarSoz' ? 'active' : ''}>Taomlar sozlamasi</Link> </li>
                <li className='dataSidebar'> <Link to="/Stollar" className={location.pathname === '/Stollar' ? 'active' : ''}>Stollar</Link> </li>
                <li className='dataSidebar'> <Link to="/Sozlamalar" className={location.pathname === '/Sozlamalar' ? 'active' : ''}>Sozlamalar</Link> </li>
                <li className='dataSidebar'> <Link to="/Chiqish" className={location.pathname === '/Chiqish' ? 'active' : ''}>Chiqish</Link> </li>
            </ul>
        </nav>
      </aside>
    </>
  )
}

