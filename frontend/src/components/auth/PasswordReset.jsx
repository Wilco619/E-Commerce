import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { authAPI } from '../../services/api';

const PasswordReset = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await authAPI.resetPassword({
                uid,
                token,
                new_password: password
            });
            
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Password reset failed');
        }
    };

    return (
        <Box sx={{
            maxWidth: 400,
            mx: 'auto',
            mt: 8,
            p: 3,
            boxShadow: 3,
            borderRadius: 2,
            bgcolor: 'background.paper'
        }}>
            <Typography variant="h5" mb={3} textAlign="center">
                Reset Your Password
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success ? (
                <Alert severity="success">
                    Password reset successful! Redirecting to login...
                </Alert>
            ) : (
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        margin="normal"
                        required
                    />
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3 }}
                    >
                        Reset Password
                    </Button>
                </form>
            )}
        </Box>
    );
};

export default PasswordReset;