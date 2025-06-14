const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Power events endpoint (M5StickC sends data here)
router.post('/power-events', [
  body('device_id').isString().isLength({ min: 1, max: 100 }),
  body('timestamp').isISO8601(),
  body('event_type').isIn(['power_on', 'power_off', 'battery_low', 'system_error']),
  body('message').optional().isString().isLength({ max: 500 }),
  body('battery_percentage').optional().isInt({ min: 0, max: 100 }),
  body('battery_voltage').optional().isFloat({ min: 0, max: 10 }),
  body('wifi_signal_strength').optional().isInt({ min: -100, max: 0 }),
  body('free_heap').optional().isInt({ min: 0 })
], validateRequest, async (req, res) => {
  try {
    const {
      device_id,
      timestamp,
      uptime_ms,
      event_type,
      message,
      battery_percentage,
      battery_voltage,
      wifi_signal_strength,
      free_heap
    } = req.body;

    // Insert device if not exists
    await db.query(`
      INSERT INTO devices (device_id, name, is_active, updated_at)
      VALUES ($1, $1, true, NOW())
      ON CONFLICT (device_id) 
      DO UPDATE SET updated_at = NOW(), is_active = true
    `, [device_id]);

    // Insert power event
    const result = await db.query(`
      INSERT INTO power_events (
        device_id, timestamp, uptime_ms, event_type, message,
        battery_percentage, battery_voltage, wifi_signal_strength, free_heap
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      device_id, timestamp, uptime_ms, event_type, message,
      battery_percentage, battery_voltage, wifi_signal_strength, free_heap
    ]);

    // Cache latest event for dashboard
    await redis.setex(`latest_event:${device_id}`, 3600, JSON.stringify(req.body));

    logger.info('Power event recorded', {
      eventId: result.rows[0].id,
      deviceId: device_id,
      eventType: event_type
    });

    res.status(201).json({
      success: true,
      event_id: result.rows[0].id,
      message: 'Event recorded successfully'
    });

  } catch (error) {
    logger.error('Error recording power event:', error);
    res.status(500).json({
      error: 'Failed to record event',
      message: error.message
    });
  }
});

// Get devices
router.get('/devices', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, ds.* 
      FROM devices d
      LEFT JOIN device_stats ds ON d.device_id = ds.device_id
      WHERE d.is_active = true
      ORDER BY d.updated_at DESC
    `);

    res.json({
      devices: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get power events with pagination and filtering
router.get('/power-events', [
  query('device_id').optional().isString(),
  query('event_type').optional().isIn(['power_on', 'power_off', 'battery_low', 'system_error']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const {
      device_id,
      event_type,
      start_date,
      end_date,
      page = 1,
      limit = 100
    } = req.query;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (device_id) {
      whereClause += ` AND device_id = $${paramIndex++}`;
      params.push(device_id);
    }

    if (event_type) {
      whereClause += ` AND event_type = $${paramIndex++}`;
      params.push(event_type);
    }

    if (start_date) {
      whereClause += ` AND timestamp >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND timestamp <= $${paramIndex++}`;
      params.push(end_date);
    }

    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT * FROM power_events 
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) FROM power_events WHERE ${whereClause}
    `, params);

    res.json({
      events: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching power events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get power sessions for Gantt chart
router.get('/power-sessions', [
  query('device_id').optional().isString(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], validateRequest, async (req, res) => {
  try {
    const { device_id, start_date, end_date } = req.query;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (device_id) {
      whereClause += ` AND device_id = $${paramIndex++}`;
      params.push(device_id);
    }

    if (start_date) {
      whereClause += ` AND session_start >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND session_start <= $${paramIndex++}`;
      params.push(end_date);
    }

    const result = await db.query(`
      SELECT 
        id,
        device_id,
        session_start,
        session_end,
        duration_minutes,
        start_battery_percentage,
        end_battery_percentage,
        total_events,
        session_type
      FROM power_sessions 
      WHERE ${whereClause}
      ORDER BY session_start DESC
      LIMIT 1000
    `, params);

    res.json({
      sessions: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    logger.error('Error fetching power sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get daily event summary for calendar view
router.get('/daily-summary', [
  query('device_id').optional().isString(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], validateRequest, async (req, res) => {
  try {
    const { device_id, start_date, end_date } = req.query;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (device_id) {
      whereClause += ` AND device_id = $${paramIndex++}`;
      params.push(device_id);
    }

    if (start_date) {
      whereClause += ` AND event_date >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND event_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    const result = await db.query(`
      SELECT * FROM daily_event_summary 
      WHERE ${whereClause}
      ORDER BY event_date DESC
      LIMIT 365
    `, params);

    res.json({
      daily_summary: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    logger.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [devicesResult, eventsResult, sessionsResult] = await Promise.all([
      db.query('SELECT COUNT(*) as total_devices FROM devices WHERE is_active = true'),
      db.query('SELECT COUNT(*) as total_events FROM power_events WHERE timestamp >= NOW() - INTERVAL \'24 hours\''),
      db.query('SELECT COUNT(*) as active_sessions FROM power_sessions WHERE session_end IS NULL')
    ]);

    const stats = {
      total_devices: parseInt(devicesResult.rows[0].total_devices),
      events_24h: parseInt(eventsResult.rows[0].total_events),
      active_sessions: parseInt(sessionsResult.rows[0].active_sessions),
      timestamp: new Date().toISOString()
    };

    await redis.setex(cacheKey, 300, JSON.stringify(stats)); // Cache for 5 minutes

    res.json(stats);

  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;