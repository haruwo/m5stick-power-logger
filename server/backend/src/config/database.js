const { Sequelize } = require('sequelize')
const logger = require('../utils/logger')

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'power_logger',
  username: process.env.DB_USER || 'power_logger_user',
  password: process.env.DB_PASSWORD || 'power_logger_password',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    timezone: 'Etc/GMT',
  },
  timezone: '+00:00',
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

module.exports = sequelize