import './styles/header.css';
export default function header() {
  
  return (
    <>
    <div>
      <header>
        <div className="header__buttons">
            <button style={{width: 'auto', height: 'auto'}}>Komissiya jami: $0.00</button>
            <button style={{width: 'auto', height: 'auto'}}>Bugungi komissiya: $0.00</button>
            <button style={{width: 'auto', height: 'auto'}}>Oxirgi 30 kungi komissiya: $0.00</button>
            <select>
                <option>AdminInfo@gmail.com</option>
            </select>
        </div>
      </header>
      </div>
    </>
  )
}

