import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Products() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get(`/api/products?storeId=${storeId}`).then(res => setProducts(res.data))
  }, [storeId])

  const addToCart = (product) => {
    const exists = cart.find(i => i.productId === product.id)
    if (exists) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.productId !== productId))
  }

  const createOrder = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      await api.post('/api/orders', { storeId, items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })) })
      setMsg('✅ Orden creada exitosamente')
      setCart([])
    } catch (err) {
      setMsg('❌ Error al crear la orden')
    }
    setLoading(false)
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate('/stores')}>← Volver</button>
      <h2 style={styles.title}>🛍️ Productos</h2>
      {msg && <p style={styles.msg}>{msg}</p>}
      <div style={styles.layout}>
        <div style={styles.productList}>
          {products.length === 0 && <p style={{ color: '#999' }}>No hay productos disponibles</p>}
          {products.map(p => (
            <div key={p.id} style={styles.productCard}>
              <div>
                <h3 style={styles.productName}>{p.name}</h3>
                {p.description && <p style={styles.desc}>{p.description}</p>}
                <p style={styles.price}>${p.price.toLocaleString()}</p>
              </div>
              <button style={styles.addBtn} onClick={() => addToCart(p)}>+ Agregar</button>
            </div>
          ))}
        </div>
        <div style={styles.cart}>
          <h3 style={styles.cartTitle}>🛒 Carrito</h3>
          {cart.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>Agrega productos</p>}
          {cart.map(i => (
            <div key={i.productId} style={styles.cartItem}>
              <span>{i.name} x{i.quantity}</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={styles.price}>${(i.price * i.quantity).toLocaleString()}</span>
                <button style={styles.removeBtn} onClick={() => removeFromCart(i.productId)}>✕</button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <div style={styles.total}>Total: ${total.toLocaleString()}</div>
              <button style={styles.orderBtn} onClick={createOrder} disabled={loading}>
                {loading ? 'Creando...' : 'Hacer pedido'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  back: { background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem', padding: 0 },
  title: { margin: '0 0 1.5rem', fontSize: '1.5rem' },
  msg: { background: '#f0f9f0', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' },
  productList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  productCard: { background: 'white', padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productName: { margin: '0 0 0.25rem', fontSize: '1rem' },
  desc: { margin: '0 0 0.25rem', color: '#888', fontSize: '0.85rem' },
  price: { margin: 0, color: '#FF6B35', fontWeight: '600' },
  addBtn: { padding: '0.5rem 1rem', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  cart: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', height: 'fit-content', position: 'sticky', top: '1rem' },
  cartTitle: { margin: '0 0 1rem', fontSize: '1.1rem' },
  cartItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' },
  removeBtn: { background: '#fee', border: 'none', color: '#c00', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.4rem' },
  total: { fontWeight: '600', margin: '1rem 0', textAlign: 'right' },
  orderBtn: { width: '100%', padding: '0.75rem', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }
}