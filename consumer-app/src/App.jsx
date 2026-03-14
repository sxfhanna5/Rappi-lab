import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Stores from './pages/Stores'
import Products from './pages/Products'
import Orders from './pages/Orders'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/stores" element={<PrivateRoute><Stores /></PrivateRoute>} />
        <Route path="/stores/:storeId/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/stores" />} />
      </Routes>
    </BrowserRouter>
  )
}