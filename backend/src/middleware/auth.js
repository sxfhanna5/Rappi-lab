const jwt = require('jsonwebtoken')

// Verifica que el token JWT sea válido
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' })
    req.user = user // guarda el usuario en la request
    next()
  })
}

// Verifica que el usuario tenga el rol correcto
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esto' })
    }
    next()
  }
}

module.exports = { authenticateToken, requireRole }