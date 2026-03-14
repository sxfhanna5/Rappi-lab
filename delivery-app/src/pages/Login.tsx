import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import './Auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/auth/login', form)
      const { token, user } = res.data
      if (user.role !== 'delivery') {
        setError('Esta app es solo para repartidores')
        return
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Error al iniciar sesión')
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">🚗 Delivery App</h2>
        <p className="auth-subtitle">Panel de repartidores</p>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="auth-input" type="password" placeholder="Contraseña"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button className="auth-button delivery" type="submit">Iniciar sesión</button>
        </form>
        <p className="auth-link">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </div>
    </div>
  )
}