import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  Luggage,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Copy,
  FolderArchive,
  Loader2,
  X,
  Compass,
  Check
} from 'lucide-react';

const Trips = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTripsAndTemplates = async () => {
    try {
      setLoading(true);
      const [tripsRes, templatesRes] = await Promise.all([
        client.get('/trips'),
        client.get('/templates')
      ]);
      setTrips(tripsRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      console.error("Failed to load trips", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndTemplates();
    
    // Open create modal if ?new=true is in URL
    if (searchParams.get('new') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (endDate && val && endDate < val) {
      setEndDate(val);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');

    const todayStr = getTodayString();
    if (startDate < todayStr) {
      setError('Start date cannot be yesterday or earlier.');
      return;
    }

    if (endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        destination,
        startDate,
        endDate,
        description,
        status,
        templateId: selectedTemplateId ? parseInt(selectedTemplateId) : null
      };

      const res = await client.post('/trips', payload);
      
      // Reset form
      setName('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setSelectedTemplateId('');
      setShowCreateModal(false);
      setSearchParams({});
      
      // Navigate to the newly created trip details page!
      navigate(`/trips/${res.data.id}`);
    } catch (err) {
      setError('Failed to create trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicateTrip = async (id, e) => {
    e.stopPropagation(); // Avoid navigating to details page
    try {
      await client.post(`/trips/${id}/duplicate`);
      fetchTripsAndTemplates();
    } catch (err) {
      console.error("Failed to duplicate trip", err);
    }
  };

  const handleDeleteTrip = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this trip and its packing list?")) return;

    try {
      await client.delete(`/trips/${id}`);
      fetchTripsAndTemplates();
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  };

  // Derive a display status from the stored status + trip dates.
  // ARCHIVED is always preserved. Otherwise:
  //   today < startDate  → UPCOMING
  //   startDate ≤ today ≤ endDate → ACTIVE
  //   today > endDate    → COMPLETED
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

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[#FEF3C7] text-[#D97706]';
      case 'COMPLETED':
        return 'bg-light-green text-dark-green';
      case 'ARCHIVED':
        return 'bg-gray-100 text-secondary-text';
      default:
        return 'bg-soft-mint text-primary-green border border-primaryGreen/25';
    }
  };

  // All trip types (COMPLETED, ONGOING/ACTIVE, ARCHIVED, UPCOMING) can be deleted
  const canDelete = () => true;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-8 font-sans">
      <div className="flex items-center justify-between border-b border-theme-border pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text flex items-center gap-2">My Trips</h1>
          <p className="text-sm text-secondary-text mt-1">Manage and track your travel checklists.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary-green text-white px-4 py-2.5 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow"
        >
          <Plus size={16} />
          Create Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-theme-border shadow-sm rounded-[18px] py-16 px-4 text-center max-w-lg mx-auto mt-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-soft-mint text-dark-green rounded-full flex items-center justify-center mb-6">
            <Luggage size={40} />
          </div>
          <h3 className="text-xl font-bold text-primary-text">No trips planned yet!</h3>
          <p className="text-sm text-secondary-text mt-2 max-w-sm">
            Create your first trip and let WhereIsIt help you remember everything.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 bg-primary-green text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow"
          >
            + Create Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => navigate(`/trips/${trip.id}`)}
              className="bg-white border border-theme-border rounded-[18px] shadow-sm hover:shadow-md hover:border-primary-green/20 transition-theme p-6 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadgeColor(computeStatus(trip))}`}>
                    {computeStatus(trip)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDuplicateTrip(trip.id, e)}
                      title="Duplicate Trip"
                      className="p-1.5 text-secondary-text hover:text-dark-green hover:bg-theme-bg rounded-[12px] transition-theme"
                    >
                      <Copy size={16} />
                    </button>
                    {canDelete(trip) && (
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        title="Delete Trip"
                        className="p-1.5 text-secondary-text hover:text-[#EF4444] hover:bg-red-50 rounded-[12px] transition-theme"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-primary-text uppercase tracking-wide truncate">{trip.name}</h3>
                
                <p className="text-xs font-bold text-secondary-text flex items-center gap-1.5 mt-2 uppercase">
                  <MapPin size={14} className="text-primary-green" />
                  {trip.destination}
                </p>
                <p className="text-xs text-secondary-text flex items-center gap-1.5 mt-1.5">
                  <Calendar size={14} />
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </p>

                {trip.description && (
                  <p className="text-xs text-secondary-text mt-3 line-clamp-2 italic bg-soft-mint/50 p-2 rounded-[12px]">
                    "{trip.description}"
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-theme-border">
                <div className="flex justify-between items-center text-xs font-semibold text-secondary-text mb-1.5">
                  <span>{trip.packedItems} / {trip.totalItems} packed</span>
                  <span className="font-bold text-dark-green">{trip.progressPercent}%</span>
                </div>
                <div className="w-full bg-theme-bg rounded-full h-2 overflow-hidden border border-theme-border">
                  <div
                    className="bg-primary-green h-full rounded-full transition-all duration-300"
                    style={{ width: `${trip.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green flex items-center gap-2">
                <Compass size={20} />
                Plan a New Trip
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSearchParams({});
                }}
                className="text-secondary-text hover:text-primary-text"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-[12px] p-3 text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Vacation"
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Goa, Paris"
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={getTodayString()}
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate || getTodayString()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Trip Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Start Packing Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  >
                    <option value="">Start Empty</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.isCustom ? 'Custom' : 'Preset'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Trip goals, details, flight times, etc."
                  rows="3"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-theme-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSearchParams({});
                  }}
                  className="px-4 py-2 border border-theme-border text-sm text-secondary-text rounded-[12px] hover:bg-theme-bg transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary-green hover:bg-dark-green text-white text-sm font-semibold rounded-[12px] transition-theme flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;

