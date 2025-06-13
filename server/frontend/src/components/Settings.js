import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  TextField,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30,
    eventLimit: 100,
    showNotifications: true,
    compactView: false,
    timezone: 'Asia/Tokyo'
  });
  const [saveMessage, setSaveMessage] = useState(null);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('powerLoggerSettings', JSON.stringify(settings));
    setSaveMessage('設定が保存されました');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    const defaultSettings = {
      theme: 'light',
      autoRefresh: true,
      refreshInterval: 30,
      eventLimit: 100,
      showNotifications: true,
      compactView: false,
      timezone: 'Asia/Tokyo'
    };
    setSettings(defaultSettings);
    setSaveMessage('設定がリセットされました');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('powerLoggerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                アプリケーション設定
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleReset}
                >
                  リセット
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  保存
                </Button>
              </Box>
            </Box>

            {saveMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {saveMessage}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              表示設定
            </Typography>

            <Box mb={3}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>テーマ</InputLabel>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  label="テーマ"
                >
                  <MenuItem value="light">ライト</MenuItem>
                  <MenuItem value="dark">ダーク</MenuItem>
                  <MenuItem value="auto">自動</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.compactView}
                    onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                  />
                }
                label="コンパクト表示"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              データ表示
            </Typography>

            <Box mb={3}>
              <TextField
                label="デフォルト表示件数"
                type="number"
                size="small"
                fullWidth
                value={settings.eventLimit}
                onChange={(e) => handleSettingChange('eventLimit', parseInt(e.target.value))}
                inputProps={{ min: 10, max: 1000, step: 10 }}
                sx={{ mb: 2 }}
                helperText="タイムラインビューでの初期表示件数"
              />

              <FormControl fullWidth size="small">
                <InputLabel>タイムゾーン</InputLabel>
                <Select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  label="タイムゾーン"
                >
                  <MenuItem value="Asia/Tokyo">日本標準時 (JST)</MenuItem>
                  <MenuItem value="UTC">協定世界時 (UTC)</MenuItem>
                  <MenuItem value="America/New_York">東部標準時 (EST)</MenuItem>
                  <MenuItem value="Europe/London">グリニッジ標準時 (GMT)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              自動更新設定
            </Typography>

            <Box mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  />
                }
                label="自動更新を有効にする"
                sx={{ mb: 2 }}
              />

              <TextField
                label="更新間隔（秒）"
                type="number"
                size="small"
                fullWidth
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                disabled={!settings.autoRefresh}
                inputProps={{ min: 5, max: 300, step: 5 }}
                helperText="5秒から300秒の間で設定してください"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              通知設定
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showNotifications}
                  onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
                />
              }
              label="ブラウザ通知を有効にする"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              システム情報
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    アプリケーション
                  </Typography>
                  <Typography variant="body1">
                    M5StickC Plus2 Power Logger
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    バージョン: 1.0.0
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ブラウザ
                  </Typography>
                  <Typography variant="body1">
                    {navigator.userAgent.split(' ').slice(-1)[0]}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    画面解像度
                  </Typography>
                  <Typography variant="body1">
                    {window.screen.width} × {window.screen.height}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon color="primary" />
              <Typography variant="body2" color="text.secondary">
                設定はブラウザのローカルストレージに保存されます。
                異なるブラウザやデバイスでは設定が共有されません。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              キーボードショートカット
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">ダッシュボード</Typography>
                  <Chip label="Alt + 1" size="small" variant="outlined" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">カレンダービュー</Typography>
                  <Chip label="Alt + 2" size="small" variant="outlined" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">タイムライン</Typography>
                  <Chip label="Alt + 3" size="small" variant="outlined" />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">デバイス管理</Typography>
                  <Chip label="Alt + 4" size="small" variant="outlined" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">データ更新</Typography>
                  <Chip label="F5 または Ctrl + R" size="small" variant="outlined" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body2">検索</Typography>
                  <Chip label="Ctrl + F" size="small" variant="outlined" />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Settings;