import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import './Products.css'

interface Product {
  id: string
  name: string
  price: number
  description?: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export default function Products() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get(`/api/products?storeId=${storeId}`).then(res => setProducts(res.data))
  }, [storeId])

  const addToCart = (product: Product) => {
    const exists = cart.find(i => i.productId === product.id)
    if (exists) {
      setCart(cart.map(i => i.productId === product.id
        ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId))
  }

  const createOrder = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      await api.post('/api/orders', {
        storeId,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
      })
      setMsg('✅ Orden creada exitosamente')
      setCart([])
    } catch {
      setMsg('❌ Error al crear la orden')
    }
    setLoading(false)
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="products-container">
      <button className="back-btn" onClick={() => navigate('/stores')}>← Volver</button>
      <h2 className="products-title">🛍️ Productos</h2>
      {msg && <p className="products-msg">{msg}</p>}
      <div className="products-layout">
        <div className="products-list">
          {products.length === 0 && <p className="empty-msg">No hay productos disponibles</p>}
          {products.map(p => (
            <div key={p.id} className="product-card">
              <div>
                <h3 className="product-name">{p.name}</h3>
                {p.description && <p className="product-desc">{p.description}</p>}
                <p className="product-price">${p.price.toLocaleString()}</p>
              </div>
              <button className="add-btn" onClick={() => addToCart(p)}>+ Agregar</button>
            </div>
          ))}
        </div>
        <div className="cart">
          <h3 className="cart-title">🛒 Carrito</h3>
          {cart.length === 0 && <p className="empty-msg">Agrega productos</p>}
          {cart.map(i => (
            <div key={i.productId} className="cart-item">
              <span>{i.name} x{i.quantity}</span>
              <div className="cart-item-right">
                <span className="product-price">${(i.price * i.quantity).toLocaleString()}</span>
                <button className="remove-btn" onClick={() => removeFromCart(i.productId)}>✕</button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <div className="cart-total">Total: ${total.toLocaleString()}</div>
              <button className="order-btn" onClick={createOrder} disabled={loading}>
                {loading ? 'Creando...' : 'Hacer pedido'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}