const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const PowerEvent = sequelize.define('PowerEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'devices',
      key: 'device_id'
    }
  },
  event_type: {
    type: DataTypes.ENUM('power_on', 'power_off', 'battery_low', 'system_error'),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  battery_percentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  battery_voltage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  wifi_signal_strength: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  free_heap: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uptime_ms: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'power_events',
  indexes: [
    {
      fields: ['device_id']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['event_type']
    },
    {
      fields: ['device_id', 'timestamp']
    },
    {
      fields: ['device_id', 'event_type']
    },
    {
      fields: ['timestamp', 'event_type']
    }
  ],
  hooks: {
    beforeSave: (event) => {
      if (!event.timestamp) {
        event.timestamp = new Date()
      }
    }
  }
})

module.exports = PowerEvent