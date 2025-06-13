import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Circle as StatusIcon,
  SignalWifi4Bar as SignalIcon,
  Battery3Bar as BatteryIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { apiService } from '../services/api';

const DevicesView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceHealth, setDeviceHealth] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', is_active: true });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDevices();
      setDevices(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceHealth = async (deviceId) => {
    try {
      const response = await apiService.getDeviceHealth(deviceId, 7);
      setDeviceHealth(response.data);
    } catch (err) {
      console.error('Failed to fetch device health:', err);
      setDeviceHealth(null);
    }
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setEditForm({
      name: device.name || '',
      is_active: device.is_active
    });
    setEditDialog(true);
  };

  const handleDeleteDevice = (device) => {
    setSelectedDevice(device);
    setDeleteDialog(true);
  };

  const handleViewDetails = async (device) => {
    setSelectedDevice(device);
    setDetailsDialog(true);
    await fetchDeviceHealth(device.device_id);
  };

  const handleSaveEdit = async () => {
    try {
      await apiService.updateDevice(selectedDevice.device_id, editForm);
      setEditDialog(false);
      fetchDevices();
    } catch (err) {
      console.error('Failed to update device:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await apiService.deleteDevice(selectedDevice.device_id);
      setDeleteDialog(false);
      fetchDevices();
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const getDeviceStatus = (device) => {
    const isOnline = apiService.isDeviceOnline(device.last_seen);
    return {
      status: isOnline ? 'オンライン' : 'オフライン',
      color: isOnline ? '#4caf50' : '#f44336',
      lastSeen: apiService.formatRelativeTime(device.last_seen)
    };
  };

  const getBatteryColor = (percentage) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 30) return '#ff9800';
    return '#f44336';
  };

  const getSignalBars = (rssi) => {
    const signal = apiService.formatSignalStrength(rssi);
    return signal.bars;
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        エラーが発生しました: {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                デバイス管理
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDevices}
              >
                更新
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>デバイス</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>バッテリー</TableCell>
                      <TableCell>WiFi信号</TableCell>
                      <TableCell>最終更新</TableCell>
                      <TableCell>イベント数</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map((device) => {
                      const status = getDeviceStatus(device);
                      return (
                        <TableRow key={device.device_id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {device.name || device.device_id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {device.model} • {device.firmware_version}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <StatusIcon sx={{ color: status.color, fontSize: 12 }} />
                              <Typography variant="body2" sx={{ color: status.color }}>
                                {status.status}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {device.battery_percentage !== null ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <BatteryIcon sx={{ color: getBatteryColor(device.battery_percentage) }} />
                                <Typography variant="body2">
                                  {device.battery_percentage}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={device.battery_percentage}
                                  sx={{
                                    width: 50,
                                    bgcolor: 'grey.300',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getBatteryColor(device.battery_percentage)
                                    }
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                不明
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {device.wifi_signal_strength !== null ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <SignalIcon />
                                <Typography variant="body2">
                                  {device.wifi_signal_strength}dBm
                                </Typography>
                                <Box display="flex" gap="1px">
                                  {[1, 2, 3, 4].map((bar) => (
                                    <Box
                                      key={bar}
                                      width={3}
                                      height={bar * 2 + 2}
                                      bgcolor={
                                        bar <= getSignalBars(device.wifi_signal_strength)
                                          ? 'primary.main'
                                          : 'grey.300'
                                      }
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                不明
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {status.lastSeen}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={device.stats?.total_events || 0}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="詳細表示">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(device)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="編集">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditDevice(device)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="削除">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteDevice(device)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {devices.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      登録されているデバイスがありません
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Edit Device Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>デバイス編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="デバイス名"
            fullWidth
            variant="outlined"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
            }
            label="アクティブ"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>キャンセル</Button>
          <Button onClick={handleSaveEdit} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>デバイス削除</DialogTitle>
        <DialogContent>
          <Typography>
            デバイス「{selectedDevice?.name || selectedDevice?.device_id}」を削除しますか？
            この操作は取り消せません。すべての関連イベントも削除されます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>キャンセル</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Device Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={() => setDetailsDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          デバイス詳細: {selectedDevice?.name || selectedDevice?.device_id}
        </DialogTitle>
        <DialogContent>
          {deviceHealth ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>基本情報</Typography>
                <Typography variant="body2">
                  デバイスID: {deviceHealth.device_id}
                </Typography>
                <Typography variant="body2">
                  最終更新: {apiService.formatRelativeTime(deviceHealth.current_status.last_seen)}
                </Typography>
                <Typography variant="body2">
                  バッテリー: {deviceHealth.current_status.battery_percentage}% 
                  ({deviceHealth.current_status.battery_voltage}V)
                </Typography>
                <Typography variant="body2">
                  WiFi信号: {deviceHealth.current_status.wifi_signal_strength}dBm
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>バッテリー履歴</Typography>
                <Box height={200}>
                  <ResponsiveContainer>
                    <LineChart data={deviceHealth.battery_history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp"
                        tickFormatter={(value) => moment(value).format('MM/DD HH:mm')}
                      />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip
                        labelFormatter={(value) => moment(value).format('YYYY/MM/DD HH:mm:ss')}
                        formatter={(value) => [`${value}%`, 'バッテリー']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="battery_percentage" 
                        stroke="#4caf50" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  電源サイクル ({deviceHealth.power_cycles.length}件)
                </Typography>
                <Box maxHeight={200} overflow="auto">
                  {deviceHealth.power_cycles.map((cycle, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
                      <Chip
                        label={apiService.formatEventType(cycle.event_type)}
                        size="small"
                        sx={{ bgcolor: apiService.getEventTypeColor(cycle.event_type), color: 'white' }}
                      />
                      <Typography variant="body2">
                        {moment(cycle.timestamp).format('MM/DD HH:mm:ss')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default DevicesView;