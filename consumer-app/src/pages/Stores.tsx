import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Stores.css'

interface Store {
  id: string
  name: string
  is_open: boolean
}

interface User {
  name: string
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([])
  const navigate = useNavigate()
  const user: User = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/stores').then(res => setStores(res.data))
  }, [])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="stores-container">
      <div className="stores-header">
        <h2 className="stores-title">🏪 Tiendas disponibles</h2>
        <div className="stores-header-right">
          <span className="stores-username">Hola, {user.name}</span>
          <button className="btn-primary" onClick={() => navigate('/orders')}>Mis órdenes</button>
          <button className="btn-secondary" onClick={logout}>Salir</button>
        </div>
      </div>
      <div className="stores-grid">
        {stores.map(store => (
          <div key={store.id} className="store-card"
            onClick={() => navigate(`/stores/${store.id}/products`)}>
            <h3 className="store-name">{store.name}</h3>
            <span className={`store-badge ${store.is_open ? 'open' : 'closed'}`}>
              {store.is_open ? '🟢 Abierta' : '🔴 Cerrada'}
            </span>
            <p className="store-action">Ver productos →</p>
          </div>
        ))}
      </div>
    </div>
  )
}