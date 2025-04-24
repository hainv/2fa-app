import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import * as OTPAuth from 'otpauth';

function App() {
  const [secretKey, setSecretKey] = useState('');
  const [token, setToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [savedKeys, setSavedKeys] = useState(() => {
    const saved = localStorage.getItem('2fa_keys');
    return saved ? JSON.parse(saved) : [];
  });

  // Tính toán mã 2FA từ secretKey
  const generateTOTP = (secret) => {
    try {
      if (!secret) return '';

      // Tạo một đối tượng TOTP với secret key
      const totp = new OTPAuth.TOTP({
        issuer: '2FA App',
        label: 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret.replace(/\s/g, ''))
      });

      // Lấy mã TOTP hiện tại
      return totp.generate();
    } catch (error) {
      console.error('Lỗi khi tạo mã TOTP:', error);
      return '';
    }
  };

  // Tính toán thời gian còn lại cho mã hiện tại
  const calculateTimeLeft = () => {
    const seconds = 30 - Math.floor(Date.now() / 1000 % 30);
    return seconds;
  };

  // Cập nhật mã và thời gian còn lại mỗi giây
  useEffect(() => {
    if (!secretKey) return;

    const updateToken = () => {
      setToken(generateTOTP(secretKey));
      setTimeLeft(calculateTimeLeft());
    };

    // Cập nhật ngay lập tức
    updateToken();

    // Cập nhật mỗi giây
    const interval = setInterval(updateToken, 1000);

    return () => clearInterval(interval);
  }, [secretKey]);

  // Lưu danh sách khóa vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('2fa_keys', JSON.stringify(savedKeys));
  }, [savedKeys]);

  // Xử lý khi nhập secretKey mới
  const handleKeyChange = (e) => {
    setSecretKey(e.target.value);
  };

  // Xử lý sao chép mã vào clipboard
  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setSnackbarOpen(true);
    }
  };

  // Đóng thông báo snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Lưu khóa hiện tại
  const saveCurrentKey = () => {
    if (secretKey && !savedKeys.some(item => item.key === secretKey)) {
      const keyName = prompt('Nhập tên cho khóa này:') || 'Không có tên';
      setSavedKeys([...savedKeys, { key: secretKey, name: keyName }]);
    }
  };

  // Chọn một khóa đã lưu
  const selectSavedKey = (key) => {
    setSecretKey(key);
  };

  // Xóa một khóa đã lưu
  const deleteKey = (keyToDelete) => {
    setSavedKeys(savedKeys.filter(item => item.key !== keyToDelete));
    if (secretKey === keyToDelete) {
      setSecretKey('');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ứng dụng tạo mã 2FA
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <TextField
            label="Nhập Secret Key 2FA"
            variant="outlined"
            fullWidth
            value={secretKey}
            onChange={handleKeyChange}
            margin="normal"
            helperText="Nhập mã bí mật từ ứng dụng/trang web của bạn"
          />

          {secretKey && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3 }}>
                <Typography variant="h3" component="div" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                  {token || '------'}
                </Typography>
                <Tooltip title="Sao chép mã">
                  <IconButton onClick={handleCopyToken} size="large">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={(timeLeft / 30) * 100}
                  size={40}
                  sx={{ mr: 2 }}
                />
                <Typography variant="body1">
                  Mã còn hiệu lực trong {timeLeft} giây
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={saveCurrentKey}
                sx={{ mt: 2 }}
                fullWidth
              >
                Lưu khóa này
              </Button>
            </>
          )}
        </Paper>

        {savedKeys.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Các khóa đã lưu
            </Typography>
            {savedKeys.map((item, index) => (
              <Card key={index} sx={{ mb: 1, backgroundColor: item.key === secretKey ? '#f0f7ff' : 'white' }}>
                <CardContent sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  '&:last-child': { pb: 1 }
                }}>
                  <Box
                    onClick={() => selectSavedKey(item.key)}
                    sx={{
                      cursor: 'pointer',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <Typography variant="body1" noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" noWrap>
                      {item.key}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => deleteKey(item.key)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Đã sao chép mã 2FA!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;