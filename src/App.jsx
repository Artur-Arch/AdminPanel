import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout.jsx';
import SignIn from './pages/SingIn.jsx';

function App() {
  const role = localStorage.getItem('userRole'); // userRole deb olamiz

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<SignIn />} />
        <Route
          path="/menyu"
          element={role === 'CUSTOMER' ? <AdminLayout /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;