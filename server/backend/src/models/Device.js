const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'M5StickCPlus2'
  },
  firmware_version: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  last_seen: {
    type: DataTypes.DATE,
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
  local_ip: {
    type: DataTypes.INET,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'devices',
  indexes: [
    {
      fields: ['device_id']
    },
    {
      fields: ['last_seen']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeSave: (device) => {
      if (device.device_id) {
        device.device_id = device.device_id.trim()
      }
      if (device.name) {
        device.name = device.name.trim()
      }
    }
  }
})

module.exports = Device