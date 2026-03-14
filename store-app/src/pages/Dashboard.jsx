import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const statusLabel = {
  pending: '⏳ Pendiente',
  accepted: '🚗 Aceptada',
  preparing: '👨‍🍳 Preparando',
  ready: '✅ Lista',
  delivered: '📦 Entregada',
  declined: '❌ Rechazada'
}

export default function Dashboard() {
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' })
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('products')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [storeRes, ordersRes] = await Promise.all([
      api.get('/api/stores/my'),
      api.get('/api/orders/store')
    ])
    setStore(storeRes.data)
    if (storeRes.data) {
      const productsRes = await api.get(`/api/products?storeId=${storeRes.data.id}`)
      setProducts(productsRes.data)
    }
    setOrders(ordersRes.data)
  }

  const toggleStore = async () => {
    const res = await api.patch('/api/stores/my/toggle')
    setStore(res.data)
  }

  const createProduct = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/api/products', { ...newProduct, price: parseInt(newProduct.price) })
      setMsg('✅ Producto creado')
      setNewProduct({ name: '', price: '', description: '' })
      loadData()
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al crear producto'))
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    await api.patch(`/api/orders/${orderId}/status`, { status })
    loadData()
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🏪 {store?.name || 'Mi Tienda'}</h2>
          {store && (
            <button
              style={{ ...styles.toggleBtn, background: store.is_open ? '#c62828' : '#2E7D32' }}
              onClick={toggleStore}
            >
              {store.is_open ? '🔴 Cerrar tienda' : '🟢 Abrir tienda'}
            </button>
          )}
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'products' ? styles.activeTab : {}) }}
          onClick={() => setTab('products')}>Productos ({products.length})</button>
        <button style={{ ...styles.tab, ...(tab === 'orders' ? styles.activeTab : {}) }}
          onClick={() => setTab('orders')}>Órdenes ({orders.length})</button>
      </div>

      {/* Productos */}
      {tab === 'products' && (
        <div>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Agregar producto</h3>
            {msg && <p style={styles.msg}>{msg}</p>}
            <form onSubmit={createProduct}>
              <input style={styles.input} placeholder="Nombre del producto"
                value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Precio"
                value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
              <input style={styles.input} placeholder="Descripción (opcional)"
                value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              <button style={styles.greenBtn} type="submit">+ Agregar producto</button>
            </form>
          </div>
          <div style={styles.list}>
            {products.length === 0 && <p style={{ color: '#999' }}>No hay productos aún</p>}
            {products.map(p => (
              <div key={p.id} style={styles.listItem}>
                <div>
                  <strong>{p.name}</strong>
                  {p.description && <p style={styles.desc}>{p.description}</p>}
                </div>
                <span style={styles.price}>${p.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Órdenes */}
      {tab === 'orders' && (
        <div style={styles.list}>
          {orders.length === 0 && <p style={{ color: '#999' }}>No hay órdenes aún</p>}
          {orders.map(order => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>Orden #{order.id.slice(0, 8)}</span>
                <span style={styles.orderStatus}>{statusLabel[order.status]}</span>
              </div>
              <p style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</p>
              {order.status === 'pending' && (
                <button style={styles.greenBtn}
                  onClick={() => updateOrderStatus(order.id, 'preparing')}>
                  Comenzar a preparar
                </button>
              )}
              {order.status === 'preparing' && (
                <button style={styles.greenBtn}
                  onClick={() => updateOrderStatus(order.id, 'ready')}>
                  Marcar como lista
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { margin: '0 0 0.75rem', fontSize: '1.5rem' },
  toggleBtn: { padding: '0.5rem 1.25rem', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' },
  logoutBtn: { padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: { padding: '0.6rem 1.25rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: 'white', fontSize: '0.95rem' },
  activeTab: { background: '#2E7D32', color: 'white', border: '1px solid #2E7D32' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem' },
  input: { width: '100%', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' },
  greenBtn: { padding: '0.6rem 1.25rem', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  listItem: { background: 'white', padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  desc: { margin: '0.25rem 0 0', color: '#888', fontSize: '0.85rem' },
  price: { color: '#2E7D32', fontWeight: '600', fontSize: '1.1rem' },
  msg: { padding: '0.75rem', borderRadius: '8px', background: '#f0f9f0', marginBottom: '1rem' },
  orderCard: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  orderId: { fontWeight: '600' },
  orderStatus: { fontSize: '0.9rem' },
  orderDate: { color: '#999', fontSize: '0.85rem', margin: '0 0 0.75rem' }
}