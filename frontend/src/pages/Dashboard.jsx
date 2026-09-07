import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Luggage,
  Calendar,
  CheckCircle,
  Plus,
  Sparkles,
  Search,
  BookOpen,
  MapPin,
  ClipboardList,
  Loader2,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Add Item Modal State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [itemPriority, setItemPriority] = useState('IMPORTANT');
  const [itemCategory, setItemCategory] = useState('Clothing');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [addingItem, setAddingItem] = useState(false);
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tripsRes] = await Promise.all([
        client.get('/trips/stats'),
        client.get('/trips'),
      ]);
      setStats(statsRes.data);
      setTrips(tripsRes.data);
      if (tripsRes.data.length > 0) {
        setSelectedTripId(tripsRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedTripId) return;

    setAddingItem(true);
    try {
      await client.post(`/trips/${selectedTripId}/items`, {
        name: itemName.trim(),
        category: itemCategory,
        quantity: itemQuantity,
        priority: itemPriority,
        packed: false
      });
      
      setItemName('');
      setQuickAddSuccess(true);
      setTimeout(() => {
        setQuickAddSuccess(false);
        setShowQuickAdd(false);
      }, 1500);
      
      // Refresh dashboard statistics
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to quick-add item", err);
    } finally {
      setAddingItem(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Derive display status from trip dates (mirrors Trips.jsx logic)
  const computeStatus = (trip) => {
    if (trip.status === 'ARCHIVED') return 'ARCHIVED';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(trip.endDate);
    end.setHours(0, 0, 0, 0);
    if (today < start) return 'UPCOMING';
    if (today > end) return 'COMPLETED';
    return 'ACTIVE';
  };

  // Pick the featured trip for the dashboard widget:
  //   1. Nearest UPCOMING trip (earliest start date)
  //   2. If none, the most recently started ACTIVE trip
  const upcomingTrips = trips
    .filter(t => computeStatus(t) === 'UPCOMING')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const activeTrips = trips
    .filter(t => computeStatus(t) === 'ACTIVE')
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const featuredTrip = upcomingTrips[0] || activeTrips[0] || null;
  const featuredIsActive = featuredTrip && computeStatus(featuredTrip) === 'ACTIVE';

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-8 font-sans">
      {/* Welcome & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-theme-border rounded-[18px] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text">
            {getGreeting()}, {user?.name || 'Explorer'}
          </h1>
          <p className="text-secondary-text mt-1">Ready for your next adventure?</p>
        </div>
        <Link
          to="/trips?new=true"
          className="flex items-center justify-center gap-2 bg-primary-green text-white px-5 py-3 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow self-start md:self-auto"
        >
          <Plus size={18} />
          Create New Trip
        </Link>
      </div>

      {/* Main Grid: Nearest Trip + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearest Trip Widget */}
        <div className="lg:col-span-2 bg-white border border-theme-border rounded-[18px] shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-soft-mint rounded-full -mr-16 -mt-16 -z-10 opacity-50"></div>
          {featuredTrip ? (
            <>
              <div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit uppercase mb-4 ${
                  featuredIsActive
                    ? 'bg-[#FEF3C7] text-[#D97706]'
                    : 'bg-light-green text-dark-green'
                }`}>
                  <Luggage size={14} />
                  {featuredIsActive ? 'Currently Active Trip' : 'Nearest Upcoming Trip'}
                </div>
                <h3 className="text-2xl font-bold text-primary-text uppercase">{featuredTrip.name}</h3>
                <p className="text-secondary-text text-sm flex items-center gap-1.5 mt-2">
                  <Calendar size={16} />
                  {new Date(featuredTrip.startDate).toLocaleDateString()} - {new Date(featuredTrip.endDate).toLocaleDateString()}
                </p>
                <div className="text-sm font-semibold text-secondary-text flex items-center gap-1 mt-1 uppercase">
                  <MapPin size={16} className="text-primary-green" />
                  {featuredTrip.destination}
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-semibold text-primary-text">{featuredTrip.packedItems} of {featuredTrip.totalItems} items packed</span>
                  <span className="font-bold text-dark-green text-base">{featuredTrip.progressPercent}%</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-3.5 border border-theme-border overflow-hidden">
                  <div
                    className="bg-primary-green h-full rounded-full transition-all duration-500"
                    style={{ width: `${featuredTrip.progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/trips/${featuredTrip.id}`)}
                className="mt-6 w-full md:w-fit text-center bg-soft-mint border border-primaryGreen/20 text-dark-green px-6 py-2.5 rounded-[12px] font-semibold hover:bg-light-green transition-theme flex items-center justify-center gap-2"
              >
                Continue Packing
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-soft-mint rounded-full flex items-center justify-center text-dark-green mb-4">
                <Luggage size={32} />
              </div>
              <h3 className="text-lg font-bold text-primary-text">No upcoming trips planned</h3>
              <p className="text-sm text-secondary-text mt-1 max-w-sm">
                Create a trip and start packing your items easily.
              </p>
              <Link
                to="/trips?new=true"
                className="mt-4 bg-primary-green text-white px-4 py-2 rounded-[12px] text-sm font-semibold hover:bg-dark-green transition-theme"
              >
                Add Your First Trip
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-6">
          <h3 className="text-lg font-bold text-primary-text mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/trips?new=true')}
              className="flex flex-col items-center justify-center p-4 bg-theme-bg border border-theme-border rounded-[12px] text-center hover:bg-light-green/55 hover:border-primary-green/30 transition-theme group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-green border border-theme-border mb-2 group-hover:scale-105 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-primary-text">Create Trip</span>
            </button>
            
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex flex-col items-center justify-center p-4 bg-theme-bg border border-theme-border rounded-[12px] text-center hover:bg-light-green/55 hover:border-primary-green/30 transition-theme group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-green border border-theme-border mb-2 group-hover:scale-105 transition-transform">
                <ClipboardList size={20} />
              </div>
              <span className="text-xs font-bold text-primary-text">Quick Add Item</span>
            </button>

            <button
              onClick={() => navigate('/find')}
              className="flex flex-col items-center justify-center p-4 bg-theme-bg border border-theme-border rounded-[12px] text-center hover:bg-light-green/55 hover:border-primary-green/30 transition-theme group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-green border border-theme-border mb-2 group-hover:scale-105 transition-transform">
                <Search size={20} />
              </div>
              <span className="text-xs font-bold text-primary-text">Find an Item</span>
            </button>

            <button
              onClick={() => navigate('/templates')}
              className="flex flex-col items-center justify-center p-4 bg-theme-bg border border-theme-border rounded-[12px] text-center hover:bg-light-green/55 hover:border-primary-green/30 transition-theme group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-green border border-theme-border mb-2 group-hover:scale-105 transition-transform">
                <BookOpen size={20} />
              </div>
              <span className="text-xs font-bold text-primary-text">Templates</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 border border-theme-border rounded-[18px] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-text">Upcoming Trips</p>
            <h4 className="text-2xl font-black text-primary-text mt-1">{upcomingTrips.length}</h4>
          </div>
          <div className="w-12 h-12 bg-soft-mint text-dark-green rounded-full flex items-center justify-center border border-theme-border">
            <Luggage size={22} />
          </div>
        </div>

        <div className="bg-white p-5 border border-theme-border rounded-[18px] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-text">Active Trips</p>
            <h4 className="text-2xl font-black text-primary-text mt-1">{activeTrips.length}</h4>
          </div>
          <div className="w-12 h-12 bg-soft-mint text-dark-green rounded-full flex items-center justify-center border border-theme-border">
            <Calendar size={22} />
          </div>
        </div>

        <div className="bg-white p-5 border border-theme-border rounded-[18px] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-text">Items To Pack</p>
            <h4 className="text-2xl font-black text-primary-text mt-1">{stats?.itemsToPackCount || 0}</h4>
          </div>
          <div className="w-12 h-12 bg-soft-mint text-dark-green rounded-full flex items-center justify-center border border-theme-border">
            <ClipboardList size={22} />
          </div>
        </div>

        <div className="bg-white p-5 border border-theme-border rounded-[18px] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-text">Items Packed</p>
            <h4 className="text-2xl font-black text-primary-text mt-1">{stats?.itemsPackedCount || 0}</h4>
          </div>
          <div className="w-12 h-12 bg-soft-mint text-dark-green rounded-full flex items-center justify-center border border-theme-border">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green flex items-center gap-2">
                <ClipboardList size={20} />
                + I NEED TO PACK THIS
              </h3>
              <button onClick={() => setShowQuickAdd(false)} className="text-secondary-text hover:text-primary-text">
                <X size={20} />
              </button>
            </div>
            
            {quickAddSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-primary-green text-white rounded-full flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-lg font-bold text-primary-text">Item Saved Successfully!</h4>
                <p className="text-sm text-secondary-text">Added to your trip list.</p>
              </div>
            ) : (
              <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
                {trips.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-secondary-text mb-4">You must create a trip first before adding packing items.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/trips?new=true')}
                      className="bg-primary-green text-white px-4 py-2 rounded-[12px] font-semibold text-sm hover:bg-dark-green transition-theme"
                    >
                      Create a Trip
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-primary-text mb-1">What do you need to pack?</label>
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="e.g. Power Bank, Charger, Passport"
                        className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-text mb-1">Add to Trip</label>
                      <select
                        value={selectedTripId}
                        onChange={(e) => setSelectedTripId(e.target.value)}
                        className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                      >
                        {trips.map(trip => (
                          <option key={trip.id} value={trip.id}>{trip.name.toUpperCase()} ({trip.destination})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-text mb-1">Category</label>
                        <select
                          value={itemCategory}
                          onChange={(e) => setItemCategory(e.target.value)}
                          className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                        >
                          {['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Health & Essentials', 'Accessories', 'Food', 'Travel Gear', 'Entertainment', 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary-text mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                          className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-text mb-1">Priority</label>
                      <div className="flex gap-4">
                        {['ESSENTIAL', 'IMPORTANT', 'OPTIONAL'].map(p => (
                          <label key={p} className="flex items-center gap-1.5 text-xs text-primary-text font-semibold cursor-pointer">
                            <input
                              type="radio"
                              name="priority"
                              value={p}
                              checked={itemPriority === p}
                              onChange={() => setItemPriority(p)}
                              className="text-primary-green focus:ring-primary-green"
                            />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-theme-border flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowQuickAdd(false)}
                        className="px-4 py-2 border border-theme-border text-sm text-secondary-text rounded-[12px] hover:bg-theme-bg transition-theme"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingItem}
                        className="px-5 py-2 bg-primary-green hover:bg-dark-green text-white text-sm font-semibold rounded-[12px] transition-theme flex items-center gap-1.5"
                      >
                        {addingItem ? <Loader2 size={16} className="animate-spin" /> : 'Save Item'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

