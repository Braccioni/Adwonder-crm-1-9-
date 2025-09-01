import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Notification } from '../../types';
import { notificationService } from '../../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = showAll 
        ? await notificationService.getAllNotifications()
        : await notificationService.getPendingNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, letta: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.letta).map(n => n.id);
      if (unreadIds.length > 0) {
        await notificationService.markMultipleAsRead(unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, letta: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'scadenza_45':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'reminder_30':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'sollecito_15':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'scadenza_45':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'reminder_30':
        return 'border-l-orange-500 bg-orange-50';
      case 'sollecito_15':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const pendingCount = notifications.filter(n => !n.letta).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Notifiche</h2>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowAll(false);
                  loadNotifications();
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  !showAll 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Non lette
              </button>
              <button
                onClick={() => {
                  setShowAll(true);
                  loadNotifications();
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showAll 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tutte
              </button>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Segna tutte come lette
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessuna notifica {showAll ? '' : 'non letta'}</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-4 rounded-r-md transition-all ${
                    getNotificationColor(notification.tipo_notifica)
                  } ${
                    notification.letta ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.tipo_notifica)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {notification.nome_azienda}
                          </h4>
                          {notification.giorni_rimanenti !== undefined && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {notification.giorni_rimanenti} giorni
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.messaggio}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Scadenza: {formatDate(notification.data_scadenza_contratto)}</span>
                          <span>Notifica: {formatDate(notification.data_notifica)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {notification.letta ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Segna come letta"
                        >
                          <Check className="h-4 w-4" />
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

export default NotificationCenter;