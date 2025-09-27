// src/utils/notificationsApi.js
import { BACKEND_URL } from './api';

export const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user && user.token ? user.token : null;
};

export const fetchNotifications = async (token) => {
  const res = await fetch(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const fetchUnreadCount = async (token) => {
  const res = await fetch(`${BACKEND_URL}/api/notifications/unread/count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markNotificationAsRead = async (id, token) => {
  await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
};
