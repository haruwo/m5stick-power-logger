const express = require('express')
const { Op } = require('sequelize')
const moment = require('moment')
const { PowerEvent, Device } = require('../models')

const router = express.Router()

router.get('/summary', async (req, res, next) => {
  try {
    const { start_date, end_date, device_id } = req.query

    const whereClause = {}
    if (device_id) whereClause.device_id = device_id
    if (start_date || end_date) {
      whereClause.timestamp = {}
      if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date)
      if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date)
    }

    const [totalEvents, eventsByType, deviceCount, recentEvents] = await Promise.all([
      PowerEvent.count({ where: whereClause }),
      
      PowerEvent.findAll({
        where: whereClause,
        attributes: [
          'event_type',
          [PowerEvent.sequelize.fn('COUNT', PowerEvent.sequelize.col('id')), 'count']
        ],
        group: ['event_type'],
        raw: true
      }),
      
      Device.count({ where: { is_active: true } }),
      
      PowerEvent.findAll({
        where: whereClause,
        limit: 5,
        order: [['timestamp', 'DESC']],
        include: [{
          model: Device,
          as: 'device',
          attributes: ['device_id', 'name']
        }]
      })
    ])

    res.json({
      success: true,
      data: {
        summary: {
          total_events: totalEvents,
          active_devices: deviceCount,
          events_by_type: eventsByType.reduce((acc, item) => {
            acc[item.event_type] = parseInt(item.count)
            return acc
          }, {})
        },
        recent_events: recentEvents
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/calendar/:year/:month', async (req, res, next) => {
  try {
    const { year, month } = req.params
    const { device_id } = req.query

    const startDate = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate()
    const endDate = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate()

    const whereClause = {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    }
    
    if (device_id) {
      whereClause.device_id = device_id
    }

    const events = await PowerEvent.findAll({
      where: whereClause,
      attributes: [
        [PowerEvent.sequelize.fn('DATE', PowerEvent.sequelize.col('timestamp')), 'date'],
        'event_type',
        [PowerEvent.sequelize.fn('COUNT', PowerEvent.sequelize.col('id')), 'count']
      ],
      group: [
        PowerEvent.sequelize.fn('DATE', PowerEvent.sequelize.col('timestamp')),
        'event_type'
      ],
      order: [[PowerEvent.sequelize.fn('DATE', PowerEvent.sequelize.col('timestamp')), 'ASC']],
      raw: true
    })

    const calendarData = {}
    events.forEach(event => {
      const date = event.date
      if (!calendarData[date]) {
        calendarData[date] = {}
      }
      calendarData[date][event.event_type] = parseInt(event.count)
    })

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        calendar_data: calendarData
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/timeline', async (req, res, next) => {
  try {
    const { 
      start_date = moment().subtract(7, 'days').toISOString(),
      end_date = moment().toISOString(),
      device_id,
      interval = 'hour'
    } = req.query

    const whereClause = {
      timestamp: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    }
    
    if (device_id) {
      whereClause.device_id = device_id
    }

    let dateFormat
    switch (interval) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00'
        break
      case 'day':
        dateFormat = '%Y-%m-%d'
        break
      case 'month':
        dateFormat = '%Y-%m'
        break
      default:
        dateFormat = '%Y-%m-%d %H:00:00'
    }

    const events = await PowerEvent.findAll({
      where: whereClause,
      attributes: [
        [PowerEvent.sequelize.fn('DATE_FORMAT', PowerEvent.sequelize.col('timestamp'), dateFormat), 'period'],
        'event_type',
        [PowerEvent.sequelize.fn('COUNT', PowerEvent.sequelize.col('id')), 'count']
      ],
      group: [
        PowerEvent.sequelize.fn('DATE_FORMAT', PowerEvent.sequelize.col('timestamp'), dateFormat),
        'event_type'
      ],
      order: [[PowerEvent.sequelize.fn('DATE_FORMAT', PowerEvent.sequelize.col('timestamp'), dateFormat), 'ASC']],
      raw: true
    })

    const timelineData = {}
    events.forEach(event => {
      const period = event.period
      if (!timelineData[period]) {
        timelineData[period] = {}
      }
      timelineData[period][event.event_type] = parseInt(event.count)
    })

    res.json({
      success: true,
      data: {
        interval,
        start_date,
        end_date,
        timeline_data: timelineData
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/device/:deviceId/health', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    const { days = 7 } = req.query

    const startDate = moment().subtract(days, 'days').startOf('day').toDate()
    const endDate = moment().endOf('day').toDate()

    const device = await Device.findOne({
      where: { device_id: deviceId }
    })

    if (!device) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found'
      })
    }

    const events = await PowerEvent.findAll({
      where: {
        device_id: deviceId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    })

    const batteryHistory = events
      .filter(e => e.battery_percentage !== null)
      .map(e => ({
        timestamp: e.timestamp,
        battery_percentage: e.battery_percentage,
        battery_voltage: e.battery_voltage
      }))

    const signalHistory = events
      .filter(e => e.wifi_signal_strength !== null)
      .map(e => ({
        timestamp: e.timestamp,
        signal_strength: e.wifi_signal_strength
      }))

    const powerCycles = events.filter(e => 
      e.event_type === 'power_on' || e.event_type === 'power_off'
    ).map(e => ({
      timestamp: e.timestamp,
      event_type: e.event_type,
      message: e.message
    }))

    res.json({
      success: true,
      data: {
        device_id: deviceId,
        period: { start: startDate, end: endDate },
        battery_history: batteryHistory,
        signal_history: signalHistory,
        power_cycles: powerCycles,
        current_status: {
          last_seen: device.last_seen,
          battery_percentage: device.battery_percentage,
          battery_voltage: device.battery_voltage,
          wifi_signal_strength: device.wifi_signal_strength,
          is_active: device.is_active
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router