"use client";

import { CSSProperties } from 'react';

// Color palette for dine-in tables
export const tableColors = {
    available: {
        primary: '#52c41a',
        light: '#f6ffed',
        border: '#b7eb8f',
        gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
    occupied: {
        primary: '#fa8c16',
        light: '#fff7e6',
        border: '#ffd591',
        gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
    },
    inactive: {
        primary: '#8c8c8c',
        light: '#fafafa',
        border: '#d9d9d9',
        gradient: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
    },
    waitingForPayment: {
        primary: '#1890ff',
        light: '#e6f7ff',
        border: '#91d5ff',
        gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    },
};

export const commonDineInStyles = {
    // We can add more common styles here if needed across multiple pages
};
