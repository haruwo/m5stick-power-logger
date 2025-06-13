const sequelize = require('../config/database')
const Device = require('./Device')
const PowerEvent = require('./PowerEvent')

Device.hasMany(PowerEvent, {
  foreignKey: 'device_id',
  as: 'powerEvents'
})

PowerEvent.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device'
})

module.exports = {
  sequelize,
  Device,
  PowerEvent
}