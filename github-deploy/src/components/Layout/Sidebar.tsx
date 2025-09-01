import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Briefcase, Calendar, FileText, User, Settings, Bell, Cog } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import NotificationCenter from './NotificationCenter';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'deals', label: 'Trattative', icon: Briefcase },
    { id: 'activities', label: 'Attività', icon: Calendar },
    { id: 'operations', label: 'Operatività', icon: Cog },
    { id: 'reports', label: 'Report', icon: FileText },
    { id: 'user-management', label: 'Gestione Utenti', icon: Settings },
  ];

  useEffect(() => {
    let isMounted = true;
    
    const loadNotificationCountSafe = async () => {
      if (!isMounted) return;
      try {
        const counts = await notificationService.getNotificationCount();
        if (isMounted) {
          setNotificationCount(counts.pending);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading notification count:', error);
        }
      }
    };

    loadNotificationCountSafe();
    const interval = setInterval(loadNotificationCountSafe, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const loadNotificationCount = async () => {
    try {
      const counts = await notificationService.getNotificationCount();
      setNotificationCount(counts.pending);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <img src="/adwonder-logo.svg" alt="Adwonder CRM" className="h-8" />
        </div>
        <h1 className="text-lg font-bold text-center mt-2">Adwonder CRM</h1>
      </div>
      
      {/* Notifications Button */}
      <div className="px-6 mb-4">
        <button
          onClick={() => setShowNotifications(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5" />
            <span className="text-sm font-medium">Notifiche</span>
          </div>
          {notificationCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>
      
      <nav className="mt-8 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeTab === item.id ? 'bg-blue-600 border-r-4 border-blue-400' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      {/* User Info - Static */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Utente Sistema
            </p>
            <p className="text-xs text-gray-400 truncate">
              sistema@adwonder.com
            </p>
            <p className="text-xs text-blue-400 capitalize">
              admin
            </p>
          </div>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          loadNotificationCount();
        }} 
      />
    </div>
  );
};

export default Sidebar;