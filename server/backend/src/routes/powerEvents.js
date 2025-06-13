const express = require('express')
const { Op } = require('sequelize')
const Joi = require('joi')
const moment = require('moment')
const { PowerEvent, Device } = require('../models')
const logger = require('../utils/logger')

const router = express.Router()

const powerEventSchema = Joi.object({
  device_id: Joi.string().required().max(50),
  event_type: Joi.string().valid('power_on', 'power_off', 'battery_low', 'system_error').required(),
  timestamp: Joi.date().iso().optional(),
  message: Joi.string().optional().max(1000),
  battery_percentage: Joi.number().integer().min(0).max(100).optional(),
  battery_voltage: Joi.number().min(0).max(10).optional(),
  wifi_signal_strength: Joi.number().integer().optional(),
  free_heap: Joi.number().integer().min(0).optional(),
  uptime_ms: Joi.number().integer().min(0).optional(),
  metadata: Joi.object().optional()
})

const querySchema = Joi.object({
  device_id: Joi.string().optional(),
  event_type: Joi.string().valid('power_on', 'power_off', 'battery_low', 'system_error').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  order: Joi.string().valid('asc', 'desc').default('desc')
})

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = powerEventSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    await upsertDevice(value)

    const powerEvent = await PowerEvent.create(value)
    
    logger.info(`Power event created: ${powerEvent.id} for device ${value.device_id}`)

    res.status(201).json({
      success: true,
      data: powerEvent
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const { error, value } = querySchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    const whereClause = {}
    
    if (value.device_id) {
      whereClause.device_id = value.device_id
    }
    
    if (value.event_type) {
      whereClause.event_type = value.event_type
    }
    
    if (value.start_date || value.end_date) {
      whereClause.timestamp = {}
      if (value.start_date) {
        whereClause.timestamp[Op.gte] = value.start_date
      }
      if (value.end_date) {
        whereClause.timestamp[Op.lte] = value.end_date
      }
    }

    const { count, rows } = await PowerEvent.findAndCountAll({
      where: whereClause,
      include: [{
        model: Device,
        as: 'device',
        attributes: ['device_id', 'name', 'model']
      }],
      limit: value.limit,
      offset: value.offset,
      order: [['timestamp', value.order.toUpperCase()]],
      distinct: true
    })

    res.json({
      success: true,
      data: {
        events: rows,
        pagination: {
          total: count,
          limit: value.limit,
          offset: value.offset,
          pages: Math.ceil(count / value.limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const powerEvent = await PowerEvent.findByPk(req.params.id, {
      include: [{
        model: Device,
        as: 'device'
      }]
    })

    if (!powerEvent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Power event not found'
      })
    }

    res.json({
      success: true,
      data: powerEvent
    })
  } catch (error) {
    next(error)
  }
})

router.get('/device/:deviceId/timeline', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    const { date } = req.query

    let startDate, endDate
    if (date) {
      startDate = moment(date).startOf('day').toDate()
      endDate = moment(date).endOf('day').toDate()
    } else {
      startDate = moment().subtract(7, 'days').startOf('day').toDate()
      endDate = moment().endOf('day').toDate()
    }

    const events = await PowerEvent.findAll({
      where: {
        device_id: deviceId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']],
      include: [{
        model: Device,
        as: 'device',
        attributes: ['device_id', 'name', 'model']
      }]
    })

    const timeline = events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      event_type: event.event_type,
      message: event.message,
      battery_percentage: event.battery_percentage,
      battery_voltage: event.battery_voltage,
      wifi_signal_strength: event.wifi_signal_strength
    }))

    res.json({
      success: true,
      data: {
        device_id: deviceId,
        period: { start: startDate, end: endDate },
        timeline
      }
    })
  } catch (error) {
    next(error)
  }
})

async function upsertDevice(eventData) {
  try {
    const deviceData = {
      device_id: eventData.device_id,
      last_seen: eventData.timestamp || new Date(),
      battery_percentage: eventData.battery_percentage,
      battery_voltage: eventData.battery_voltage,
      wifi_signal_strength: eventData.wifi_signal_strength,
      free_heap: eventData.free_heap,
      uptime_ms: eventData.uptime_ms
    }

    await Device.upsert(deviceData, {
      fields: ['last_seen', 'battery_percentage', 'battery_voltage', 
               'wifi_signal_strength', 'free_heap', 'uptime_ms']
    })
  } catch (error) {
    logger.error('Failed to upsert device:', error)
  }
}

module.exports = router