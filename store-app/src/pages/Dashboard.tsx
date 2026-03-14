import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Dashboard.css'

interface Store {
  id: string
  name: string
  is_open: boolean
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
}

interface Order {
  id: string
  status: string
  created_at: string
}

interface NewProduct {
  name: string
  price: string
  description: string
}

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendiente',
  accepted: '✅ Aceptada',
  preparing: '🚗 En camino',
  ready: '📦 Lista para recoger',
  delivered: '🎉 Entregada',
  declined: '❌ Rechazada'
}

export default function Dashboard() {
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newProduct, setNewProduct] = useState<NewProduct>({ name: '', price: '', description: '' })
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadData() }, [])

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

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/api/products', { ...newProduct, price: parseInt(newProduct.price) })
      setMsg('Producto creado exitosamente')
      setNewProduct({ name: '', price: '', description: '' })
      loadData()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setMsg(axiosErr.response?.data?.error || 'Error al crear producto')
      }
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    await api.patch(`/api/orders/${orderId}/status`, { status })
    loadData()
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">

      {/* Header igual que Consumer */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h2 className="dashboard-title">{store?.name || 'Mi Tienda'}</h2>
          <p className="dashboard-greeting">Hola, <span className="dashboard-greeting-name">{user.name}</span></p>
        </div>
        <div className="dashboard-header-right">
          <button
            className={`toggle-btn ${store?.is_open ? 'close' : 'open'}`}
            onClick={toggleStore}
          >
            {store?.is_open ? 'Cerrar tienda' : 'Abrir tienda'}
          </button>
          <button className="btn-secondary" onClick={logout}>Salir</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'products' ? 'active' : ''}`}
          onClick={() => setTab('products')}
        >
          Productos ({products.length})
        </button>
        <button
          className={`tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Órdenes ({orders.length})
        </button>
      </div>

      {/* Tab Productos */}
      {tab === 'products' && (
        <div>
          {/* Card agregar producto */}
          <div className="product-form-card">
            <h3 className="form-title">Agregar producto</h3>
            {msg && <p className="form-msg">{msg}</p>}
            <form onSubmit={createProduct}>
              <input
                className="form-input"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <input
                className="form-input"
                type="number"
                placeholder="Precio"
                value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Descripción (opcional)"
                value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              />
              <button className="btn-green" type="submit">Agregar producto</button>
            </form>
          </div>

          {/* Lista de productos */}
          <div className="items-list">
            {products.length === 0 && <p className="empty-msg">No hay productos aún</p>}
            {products.map(p => (
              <div key={p.id} className="item-card">
                <div className="item-info">
                  <p className="item-name">{p.name}</p>
                  {p.description && <p className="item-desc">{p.description}</p>}
                  <p className="item-price">${p.price.toLocaleString('es-CO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Órdenes */}
      {tab === 'orders' && (
        <div className="items-list">
          {orders.length === 0 && <p className="empty-msg-centered">No hay órdenes aún</p>}
          {orders.map(order => (
            <div key={order.id} className="item-card">
              <div className="item-info">
                <p className="item-name">Orden #{order.id.slice(0, 8)}</p>
                <p className="item-desc">{statusLabel[order.status]}</p>
                <p className="item-price-small">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="order-actions">
                {order.status === 'pending' && (
                  <button className="btn-black" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                    Comenzar a preparar
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="btn-black" onClick={() => updateOrderStatus(order.id, 'ready')}>
                    Marcar como lista
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}