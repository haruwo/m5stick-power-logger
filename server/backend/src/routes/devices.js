const express = require('express')
const { Op } = require('sequelize')
const { Device, PowerEvent } = require('../models')
const logger = require('../utils/logger')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const devices = await Device.findAll({
      attributes: [
        'id', 'device_id', 'name', 'model', 'firmware_version',
        'last_seen', 'battery_percentage', 'battery_voltage',
        'wifi_signal_strength', 'is_active', 'created_at'
      ],
      order: [['last_seen', 'DESC']]
    })

    const devicesWithStats = await Promise.all(devices.map(async (device) => {
      const stats = await PowerEvent.findAll({
        where: { device_id: device.device_id },
        attributes: [
          [PowerEvent.sequelize.fn('COUNT', PowerEvent.sequelize.col('id')), 'total_events'],
          [PowerEvent.sequelize.fn('MAX', PowerEvent.sequelize.col('timestamp')), 'last_event']
        ],
        raw: true
      })

      return {
        ...device.toJSON(),
        stats: {
          total_events: parseInt(stats[0].total_events) || 0,
          last_event: stats[0].last_event
        }
      }
    }))

    res.json({
      success: true,
      data: devicesWithStats
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    
    const device = await Device.findOne({
      where: { device_id: deviceId }
    })

    if (!device) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found'
      })
    }

    const eventStats = await PowerEvent.findAll({
      where: { device_id: deviceId },
      attributes: [
        'event_type',
        [PowerEvent.sequelize.fn('COUNT', PowerEvent.sequelize.col('id')), 'count']
      ],
      group: ['event_type'],
      raw: true
    })

    const recentEvents = await PowerEvent.findAll({
      where: { device_id: deviceId },
      limit: 10,
      order: [['timestamp', 'DESC']]
    })

    res.json({
      success: true,
      data: {
        device: device.toJSON(),
        event_stats: eventStats,
        recent_events: recentEvents
      }
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    const { name, is_active } = req.body

    const device = await Device.findOne({
      where: { device_id: deviceId }
    })

    if (!device) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found'
      })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (is_active !== undefined) updateData.is_active = is_active

    await device.update(updateData)

    logger.info(`Device updated: ${deviceId}`)

    res.json({
      success: true,
      data: device
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    
    const device = await Device.findOne({
      where: { device_id: deviceId }
    })

    if (!device) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found'
      })
    }

    await PowerEvent.destroy({
      where: { device_id: deviceId }
    })

    await device.destroy()

    logger.info(`Device deleted: ${deviceId}`)

    res.json({
      success: true,
      message: 'Device and associated events deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router