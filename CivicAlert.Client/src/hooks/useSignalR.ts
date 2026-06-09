import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

export interface NotificationItem {
  id: number;
  userId: number;
  reportId: number;
  message: string;
  messageUr?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const useSignalR = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial load
    fetchNotifications();

    // SignalR is disabled for the demo. Falling back to HTTP polling every 30 seconds.
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
