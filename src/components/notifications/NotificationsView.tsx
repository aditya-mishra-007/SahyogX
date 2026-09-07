import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { NotificationItem } from '../../services/types';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (tab: string) => void;
  onRefreshUnreadCount?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate, onRefreshUnreadCount }) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (onRefreshUnreadCount) onRefreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onRefreshUnreadCount) onRefreshUnreadCount();
      showToast('All notifications marked as read.', 'info');
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const filtered = notifications.filter(n => filter === 'all' || !n.isRead);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'assessment': return <ClipboardCheck size={20} color="#0d9488" />;
      case 'review': return <MessageSquare size={20} color="#0284c7" />;
      case 'administrative': return <Calendar size={20} color="#6366f1" />;
      default: return <Bell size={20} color="#64748b" />;
    }
  };

  return (
    <div className="flex-col-gap">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Bell size={22} color="#1e3a5f" />
            Personnel Updates & Routine Notifications
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleMarkAllRead}
              title="Mark all as read"
            >
              <CheckCheck size={16} /> Mark All Read
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <p className="text-muted text-sm">Loading notification feed...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
              <p>No notifications matching current filter.</p>
            </div>
          ) : (
            <div className="flex-col-gap" style={{ gap: '12px' }}>
              {filtered.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: notif.isRead ? 'var(--bg-surface)' : 'var(--bg-surface-subtle)',
                    border: '1px solid',
                    borderColor: notif.isRead ? 'var(--border-subtle)' : 'var(--accent-teal-light)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {notif.title}
                        </strong>
                        {!notif.isRead && (
                          <span className="badge badge-attention" style={{ fontSize: '0.675rem', padding: '2px 6px' }}>
                            New
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {notif.date}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
                      {notif.actionRoute && (
                        <button
                          className="btn btn-teal btn-sm"
                          onClick={() => {
                            if (!notif.isRead) handleMarkAsRead(notif.id);
                            onNavigate(notif.actionRoute!);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Go to Section <ArrowRight size={13} />
                        </button>
                      )}
                      {!notif.isRead && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMarkAsRead(notif.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
