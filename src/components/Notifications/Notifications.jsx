import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import './Notifications.css';
import { BACKEND_URL } from '../../utils/api';

const API_URL = BACKEND_URL;

export default function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [token]);

  const fetchNotifications = async () => {
    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setNotifications(data.notifications);
  };

  const fetchUnreadCount = async () => {
    const res = await fetch(`${API_URL}/api/notifications/unread/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setUnreadCount(data.count);
  };

  const markAsRead = async (id) => {
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
    fetchUnreadCount();
  };

  return (
    <div className="notifications-container">
      <h2 className="notifications-title">Notificaciones</h2>
      {notifications.length === 0 ? (
        <div className="notif-empty">Sin notificaciones</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-card ${n.is_read ? 'read' : 'unread'}`}>
              <div className="notification-content">
                <div className="notification-message">{n.message}</div>
                <div className="notification-date">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.is_read && (
                <button 
                  className="mark-read-btn"
                  onClick={() => markAsRead(n.id)}
                >
                  Marcar como leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
