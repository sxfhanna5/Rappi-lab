import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Stores() {
  const [stores, setStores] = useState([])
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/stores').then(res => setStores(res.data))
  }, [])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏪 Tiendas disponibles</h2>
        <div style={styles.headerRight}>
          <span style={styles.userName}>Hola, {user.name}</span>
          <button style={styles.btnSecondary} onClick={() => navigate('/orders')}>Mis órdenes</button>
          <button style={styles.btnLogout} onClick={logout}>Salir</button>
        </div>
      </div>
      <div style={styles.grid}>
        {stores.map(store => (
          <div key={store.id} style={styles.card} onClick={() => navigate(`/stores/${store.id}/products`)}>
            <h3 style={styles.storeName}>{store.name}</h3>
            <span style={{ ...styles.badge, background: store.is_open ? '#e8f5e9' : '#fce4ec', color: store.is_open ? '#2e7d32' : '#c62828' }}>
              {store.is_open ? '🟢 Abierta' : '🔴 Cerrada'}
            </span>
            <p style={styles.cardAction}>Ver productos →</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  headerRight: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.5rem' },
  userName: { color: '#666', marginRight: '0.5rem' },
  btnSecondary: { padding: '0.5rem 1rem', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnLogout: { padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s' },
  storeName: { margin: '0 0 0.75rem', fontSize: '1.1rem' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' },
  cardAction: { margin: '1rem 0 0', color: '#FF6B35', fontWeight: '500' }
}