import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Package,
  LayoutDashboard,
  Luggage,
  Search,
  ClipboardList,
  Sparkles,
  Info,
  LogOut,
  Bell,
  X,
  Menu
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for reminders
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await client.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isSent: true } : n));
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Trips', path: '/trips', icon: Luggage },
    { name: 'Find My Items', path: '/find', icon: Search },
    { name: 'Templates', path: '/templates', icon: ClipboardList },
    { name: 'AI Assistant', path: '/ai', icon: Sparkles },
    { name: 'About', path: '/about', icon: Info },
  ];

  const unreadCount = notifications.filter(n => !n.isSent).length;

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col md:flex-row font-sans">
      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Green Tinted Glass Overlay */}
            <div className="absolute inset-0 bg-[#2F7D4A]/30 backdrop-blur-sm transition-opacity" onClick={() => setShowNotifications(false)}></div>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl border-l border-theme-border">
                  <div className="px-4 sm:px-6 flex items-center justify-between border-b border-theme-border pb-4">
                    <h2 className="text-lg font-bold text-dark-green flex items-center gap-2">
                      <Bell size={20} />
                      Smart Reminders
                    </h2>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="rounded-md text-secondary-text hover:text-primary-text focus:outline-none"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <div className="relative mt-4 flex-1 px-4 sm:px-6 space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-secondary-text text-center py-8">No notifications yet. You are all caught up!</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-[18px] border transition-theme relative ${
                            !notification.isSent
                              ? 'bg-soft-mint border-primaryGreen/30 shadow-sm'
                              : 'bg-white border-theme-border text-secondary-text'
                          }`}
                        >
                          <p className="text-sm pr-6">{notification.message}</p>
                          <span className="text-[10px] text-secondary-text block mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                          {!notification.isSent && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="absolute top-2 right-2 text-[10px] bg-primary-green/10 text-dark-green hover:bg-primary-green hover:text-white px-2 py-0.5 rounded-full transition-theme"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-theme-border h-screen sticky top-0 px-4 py-6">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-10 h-10 bg-primary-green text-white flex items-center justify-center rounded-[12px] nav-shadow">
            <Package size={22} />
          </div>
          <span className="text-xl font-bold text-dark-green">WhereIsIt</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-theme ${
                  isActive
                    ? 'bg-light-green text-dark-green nav-shadow'
                    : 'text-secondary-text hover:bg-theme-bg hover:text-primary-text'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-dark-green' : 'text-secondary-text'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-theme-border pt-4 mt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-soft-mint border border-theme-border flex items-center justify-center text-dark-green font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-text truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-secondary-text truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-1.5 rounded-full text-secondary-text hover:text-dark-green hover:bg-theme-bg transition-theme"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-sm font-semibold text-secondary-text hover:bg-red-50 hover:text-[#EF4444] transition-theme"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between bg-white border-b border-theme-border px-4 py-3.5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-green text-white flex items-center justify-center rounded-[12px] nav-shadow">
            <Package size={16} />
          </div>
          <span className="text-lg font-bold text-dark-green">WhereIsIt</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-full text-secondary-text hover:text-dark-green transition-theme"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-secondary-text hover:text-primary-text"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-[#2F7D4A]/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white pt-5 pb-4 border-r border-theme-border">
            <div className="flex items-center justify-between px-4 pb-4 border-b border-theme-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-green text-white flex items-center justify-center rounded-[12px]">
                  <Package size={16} />
                </div>
                <span className="text-lg font-bold text-dark-green">WhereIsIt</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-secondary-text">
                <X size={22} />
              </button>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-theme ${
                      isActive
                        ? 'bg-light-green text-dark-green'
                        : 'text-secondary-text hover:bg-theme-bg'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-theme-border pt-4 mt-auto px-4">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-2 text-sm font-semibold text-secondary-text hover:text-[#EF4444] mt-2"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (for main tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-theme-border z-40 flex justify-around py-2 md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-[12px] text-[10px] font-semibold transition-theme ${
                isActive ? 'text-dark-green' : 'text-secondary-text'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary-green' : 'text-secondary-text'} />
              {item.name === 'Find My Items' ? 'Finder' : item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
