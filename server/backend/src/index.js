const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
require('dotenv').config()

const logger = require('./utils/logger')
const { sequelize } = require('./models')
const powerEventRoutes = require('./routes/powerEvents')
const deviceRoutes = require('./routes/devices')
const analyticsRoutes = require('./routes/analytics')
const errorHandler = require('./middleware/errorHandler')
const rateLimiter = require('./middleware/rateLimiter')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}))

app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(rateLimiter)

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'M5StickC Power Logger Backend',
    version: '1.0.0'
  })
})

app.use('/api/power-events', powerEventRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use(errorHandler)

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  })
})

const startServer = async () => {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully')
    
    await sequelize.sync()
    logger.info('Database models synchronized')
    
    app.listen(PORT, () => {
      logger.info(`M5StickC Power Logger Backend server running on port ${PORT}`)
      logger.info(`Health check available at: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await sequelize.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await sequelize.close()
  process.exit(0)
})

startServer()