"use client";
import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Wait for transition
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: visible ? '20px' : '-350px',
            backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            transition: 'right 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            fontSize: '0.9rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
            }}>
                {type === 'success' ? '✓' : '!'}
            </div>
            {message}
        </div>
    );
};

export default Toast;
