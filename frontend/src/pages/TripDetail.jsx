import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client, { API_BASE_URL } from '../api/client';
import {
  Luggage,
  Calendar,
  MapPin,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Eye,
  Camera,
  Edit,
  ArrowLeft,
  Loader2,
  X,
  Lock,
  ChevronDown,
  Info,
  CircleAlert,
  Home,
  RefreshCw,
  Check
} from 'lucide-react';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterPacked, setFilterPacked] = useState('All');
  const [mode, setMode] = useState('trip'); // 'trip', 'unpack', 'return'

  // Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Clothing');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPriority, setItemPriority] = useState('IMPORTANT');
  const [itemNotes, setItemNotes] = useState('');
  const [locationRoom, setLocationRoom] = useState('');
  const [locationFurniture, setLocationFurniture] = useState('');
  const [locationShelf, setLocationShelf] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // View Item Detail Drawer State
  const [viewingItem, setViewingItem] = useState(null);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const [tripRes, itemsRes] = await Promise.all([
        client.get(`/trips/${id}`),
        client.get(`/trips/${id}/items`),
      ]);
      setTrip(tripRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to load trip details", err);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const handleDeleteTrip = async () => {
    if (!window.confirm("Are you sure you want to delete this trip and its packing list?")) return;

    try {
      await client.delete(`/trips/${id}`);
      navigate('/trips');
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  };

  const handleTogglePack = async (itemId) => {
    try {
      // Optimistic UI update
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, packed: !item.packed } : item));
      const res = await client.patch(`/items/${itemId}/pack`);
      
      // Update parent trip stats
      const total = items.length;
      const packed = items.map(item => item.id === itemId ? { ...item, packed: !item.packed } : item).filter(i => i.packed).count;
      setTrip(prev => {
        const nextPacked = prev.packedItems + (res.data.packed ? 1 : -1);
        return {
          ...prev,
          packedItems: nextPacked,
          progressPercent: prev.totalItems > 0 ? Math.round((nextPacked / prev.totalItems) * 100) : 0
        };
      });
    } catch (err) {
      console.error("Failed to toggle pack status", err);
      // Revert if API fails
      fetchTripDetails();
    }
  };

  const handleToggleReturnPack = async (itemId) => {
    try {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, returnPacked: !item.returnPacked } : item));
      await client.patch(`/items/${itemId}/return-pack`);
    } catch (err) {
      console.error("Failed to toggle return pack status", err);
      fetchTripDetails();
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingPhoto(true);

    try {
      const res = await client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setItemPhotoUrl(res.data.url);
    } catch (err) {
      console.error("Failed to upload photo", err);
      alert("Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setSavingItem(true);
    const payload = {
      name: itemName.trim(),
      category: itemCategory,
      quantity: itemQuantity,
      priority: itemPriority,
      notes: itemNotes,
      locationRoom,
      locationFurniture,
      locationShelf,
      locationDetails,
      photoUrl: itemPhotoUrl
    };

    try {
      if (editingItem) {
        const res = await client.put(`/items/${editingItem.id}`, payload);
        setItems(prev => prev.map(item => item.id === editingItem.id ? res.data : item));
      } else {
        const res = await client.post(`/trips/${id}/items`, payload);
        setItems(prev => [res.data, ...prev]);
        setTrip(prev => {
          const nextTotal = prev.totalItems + 1;
          return {
            ...prev,
            totalItems: nextTotal,
            progressPercent: Math.round((prev.packedItems / nextTotal) * 100)
          };
        });
      }
      closeItemModal();
      fetchTripDetails(); // Refresh to ensure stats are 100% correct
    } catch (err) {
      console.error("Failed to save packing item", err);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await client.delete(`/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      fetchTripDetails();
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category);
      setItemQuantity(item.quantity);
      setItemPriority(item.priority);
      setItemNotes(item.notes || '');
      setLocationRoom(item.locationRoom || '');
      setLocationFurniture(item.locationFurniture || '');
      setLocationShelf(item.locationShelf || '');
      setLocationDetails(item.locationDetails || '');
      setItemPhotoUrl(item.photoUrl || '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory('Clothing');
      setItemQuantity(1);
      setItemPriority('IMPORTANT');
      setItemNotes('');
      setLocationRoom('');
      setLocationFurniture('');
      setLocationShelf('');
      setLocationDetails('');
      setItemPhotoUrl('');
    }
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
  };

  const categories = [
    'Clothing',
    'Toiletries',
    'Electronics',
    'Documents',
    'Health & Essentials',
    'Accessories',
    'Food',
    'Travel Gear',
    'Entertainment',
    'Other'
  ];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.locationRoom && item.locationRoom.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;
    
    let matchesPacked = true;
    if (filterPacked === 'Packed') matchesPacked = item.packed;
    else if (filterPacked === 'Unpacked') matchesPacked = !item.packed;

    // Filter by mode
    if (mode === 'unpack') {
      // In Unpacking Mode, show things that were packed on the trip
      return matchesSearch && matchesCategory && matchesPriority && item.packed;
    }

    return matchesSearch && matchesCategory && matchesPriority && matchesPacked;
  });

  // Group by category
  const groupedItems = {};
  categories.forEach(cat => {
    const catItems = filteredItems.filter(item => item.category === cat);
    if (catItems.length > 0) {
      groupedItems[cat] = catItems;
    }
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-green" />
      </div>
    );
  }

  const getPriorityBadgeColor = (p) => {
    switch (p) {
      case 'ESSENTIAL':
        return 'bg-red-100 text-[#EF4444] border border-red-200';
      case 'IMPORTANT':
        return 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
      default:
        return 'bg-light-green text-dark-green border border-[#A7F3D0]';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 font-sans">
      {/* Header and navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center gap-2 text-secondary-text hover:text-dark-green font-semibold transition-theme w-fit"
        >
          <ArrowLeft size={18} />
          Back to Trips
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteTrip}
            className="border border-red-200 text-[#EF4444] bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-[12px] font-semibold transition-theme flex items-center gap-2 text-sm"
            title="Delete Trip"
          >
            <Trash2 size={16} />
            Delete Trip
          </button>

          <button
            onClick={() => navigate(`/trips/${id}/pack`)}
            className="bg-primary-green text-white px-5 py-2.5 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow flex items-center gap-2"
          >
            <Eye size={18} />
            Distraction-Free Packing Mode
          </button>
        </div>
      </div>

      {/* Trip Summary Card */}
      <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-soft-mint text-dark-green px-3 py-1 rounded-full border border-primaryGreen/20">
            {trip.status}
          </span>
          <h2 className="text-2xl font-black text-primary-text uppercase mt-3">{trip.name}</h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-semibold text-secondary-text flex items-center gap-1.5 uppercase">
              <MapPin size={16} className="text-primary-green" />
              {trip.destination}
            </p>
            <p className="text-sm text-secondary-text flex items-center gap-1.5">
              <Calendar size={16} />
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-end min-w-[200px] md:text-right">
          <span className="text-sm text-secondary-text font-bold mb-1">
            {trip.packedItems} of {trip.totalItems} Packed
          </span>
          <div className="text-3xl font-black text-dark-green">{trip.progressPercent}%</div>
          <div className="w-full bg-theme-bg border border-theme-border h-2.5 rounded-full overflow-hidden mt-2">
            <div className="bg-primary-green h-full rounded-full transition-all duration-300" style={{ width: `${trip.progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Modes Navigation Tabs */}
      <div className="flex bg-white border border-theme-border p-1 rounded-[12px] w-fit">
        <button
          onClick={() => setMode('trip')}
          className={`px-4 py-2 text-xs font-bold rounded-[12px] transition-theme flex items-center gap-1.5 ${
            mode === 'trip' ? 'bg-light-green text-dark-green font-semibold' : 'text-secondary-text hover:text-primary-text font-semibold'
          }`}
        >
          <Luggage size={14} />
          Outbound Packing
        </button>
        <button
          onClick={() => setMode('unpack')}
          className={`px-4 py-2 text-xs font-bold rounded-[12px] transition-theme flex items-center gap-1.5 ${
            mode === 'unpack' ? 'bg-light-green text-dark-green font-semibold' : 'text-secondary-text hover:text-primary-text font-semibold'
          }`}
        >
          <Home size={14} />
          Unpacking Mode
        </button>
        <button
          onClick={() => setMode('return')}
          className={`px-4 py-2 text-xs font-bold rounded-[12px] transition-theme flex items-center gap-1.5 ${
            mode === 'return' ? 'bg-light-green text-dark-green font-semibold' : 'text-secondary-text hover:text-primary-text font-semibold'
          }`}
        >
          <RefreshCw size={14} />
          Return Packing (Home)
        </button>
      </div>

      {/* Info Notice for Unpacking/Return Modes */}
      {mode === 'unpack' && (
        <div className="bg-soft-mint border border-primaryGreen/20 rounded-[12px] p-4 flex gap-3 text-sm text-dark-green">
          <Info size={20} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Unpacking Mode Active:</span> Showing only packed items. Unpack items at your destination and check them off to ensure you know where they are kept.
          </div>
        </div>
      )}
      {mode === 'return' && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-[12px] p-4 flex gap-3 text-sm text-[#D97706]">
          <CircleAlert size={20} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Return Packing Mode Active:</span> Re-pack items into your suitcases to return home. Check them off as you return them to avoid leaving items behind in hotel drawers!
          </div>
        </div>
      )}

      {/* Search and Filters Panel */}
      <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, notes..."
            className="block w-full pl-10 pr-3 py-2 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-primary-green text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {mode !== 'unpack' && (
            <select
              value={filterPacked}
              onChange={(e) => setFilterPacked(e.target.value)}
              className="border border-theme-border rounded-[11px] bg-theme-bg text-xs font-semibold px-3 py-2 text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green"
            >
              <option value="All">All Packed Status</option>
              <option value="Packed">Packed Only</option>
              <option value="Unpacked">Unpacked Only</option>
            </select>
          )}

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-theme-border rounded-[11px] bg-theme-bg text-xs font-semibold px-3 py-2 text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-theme-border rounded-[11px] bg-theme-bg text-xs font-semibold px-3 py-2 text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green"
          >
            <option value="All">All Priorities</option>
            <option value="ESSENTIAL">ESSENTIAL</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="OPTIONAL">OPTIONAL</option>
          </select>

          <button
            onClick={() => openItemModal()}
            className="bg-primary-green text-white px-4 py-2 rounded-[12px] text-xs font-bold hover:bg-dark-green transition-theme flex items-center gap-1.5"
          >
            <Plus size={16} />
            Add Custom Item
          </button>
        </div>
      </div>

      {/* Checklist Grouped view */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-16 bg-white border border-theme-border rounded-[18px] shadow-sm">
          <Luggage size={40} className="mx-auto text-secondary-text/50 mb-3" />
          <h4 className="text-base font-bold text-primary-text">No items match your filters</h4>
          <p className="text-xs text-secondary-text mt-1">Try resetting search or add a new packing item.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="bg-white border border-theme-border rounded-[18px] shadow-sm overflow-hidden">
              <div className="bg-soft-mint px-6 py-3.5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-bold text-dark-green text-sm uppercase tracking-wider">{category}</h3>
                <span className="text-xs font-bold text-secondary-text">{catItems.length} items</span>
              </div>
              <div className="divide-y divide-themeBorder">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 transition-theme ${
                      (mode === 'return' ? item.returnPacked : item.packed) ? 'bg-theme-bg/40' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                      {/* Checkbox Outbound / Return */}
                      <button
                        onClick={() => mode === 'return' ? handleToggleReturnPack(item.id) : handleTogglePack(item.id)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-theme ${
                          (mode === 'return' ? item.returnPacked : item.packed)
                            ? 'bg-primary-green border-primaryGreen text-white nav-shadow'
                            : 'border-theme-border bg-theme-bg hover:border-primary-green/55'
                        }`}
                      >
                        {(mode === 'return' ? item.returnPacked : item.packed) && <Check size={16} className="stroke-[3]" />}
                      </button>

                      <div className="min-w-0" onClick={() => setViewingItem(item)}>
                        <p className={`text-sm font-semibold text-primary-text cursor-pointer hover:text-primary-green transition-theme ${
                          (mode === 'return' ? item.returnPacked : item.packed) ? 'line-through text-secondary-text' : ''
                        }`}>
                          {item.name}
                          {item.quantity > 1 && <span className="ml-2 text-xs font-bold text-secondary-text">x{item.quantity}</span>}
                        </p>
                        
                        {/* Storage Location Memory tag */}
                        {item.locationRoom && (
                          <p className="text-[11px] text-secondary-text flex items-center gap-0.5 mt-1">
                            <MapPin size={12} className="text-primary-green" />
                            <span>
                              {item.locationRoom} 
                              {item.locationFurniture && ` → ${item.locationFurniture}`}
                              {item.locationShelf && ` → ${item.locationShelf}`}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Info tags & buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${getPriorityBadgeColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      
                      <button
                        onClick={() => openItemModal(item)}
                        className="p-1.5 text-secondary-text hover:text-dark-green rounded-[12px] transition-theme"
                      >
                        <Edit size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-secondary-text hover:text-[#EF4444] rounded-[12px] transition-theme"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Drawer (overlay modal) */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green">Checklist Item Details</h3>
              <button onClick={() => setViewingItem(null)} className="text-secondary-text hover:text-primary-text">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-primary-text">{viewingItem.name}</h4>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${getPriorityBadgeColor(viewingItem.priority)}`}>
                    {viewingItem.priority}
                  </span>
                  <span className="text-xs font-bold text-secondary-text bg-theme-bg px-2.5 py-0.5 rounded-full border border-theme-border">
                    Qty: {viewingItem.quantity}
                  </span>
                  <span className="text-xs font-bold text-secondary-text bg-theme-bg px-2.5 py-0.5 rounded-full border border-theme-border">
                    Category: {viewingItem.category}
                  </span>
                </div>
              </div>

              {/* Location Memory section */}
              <div className="bg-soft-mint/50 p-4 border border-theme-border rounded-[12px]">
                <h5 className="text-xs font-black text-dark-green uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} />
                  Saved Location Memory
                </h5>
                {viewingItem.locationRoom ? (
                  <div className="mt-3 space-y-1 text-sm font-semibold">
                    <div className="text-primary-text">
                      {viewingItem.locationRoom}
                      {viewingItem.locationFurniture && <span className="text-secondary-text"> → {viewingItem.locationFurniture}</span>}
                      {viewingItem.locationShelf && <span className="text-secondary-text"> → {viewingItem.locationShelf}</span>}
                    </div>
                    {viewingItem.locationDetails && (
                      <p className="text-xs text-secondary-text mt-1.5 font-normal italic bg-white p-2 border border-theme-border rounded-[12px]">
                        "{viewingItem.locationDetails}"
                      </p>
                    )}
                    <span className="text-[10px] text-secondary-text font-normal block pt-2 border-t border-theme-border mt-2">
                      Last location updated: {new Date(viewingItem.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-secondary-text italic mt-2">No storage location saved for this item yet.</p>
                )}
              </div>

              {/* Location Photo */}
              {viewingItem.photoUrl && (
                <div>
                  <h5 className="text-xs font-black text-dark-green uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Camera size={14} />
                    Location Photo
                  </h5>
                  <div className="border border-theme-border rounded-[12px] overflow-hidden max-h-48">
                    <img
                      src={`${API_BASE_URL}${viewingItem.photoUrl}`}
                      alt="Saved Location"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingItem.notes && (
                <div>
                  <h5 className="text-xs font-black text-dark-green uppercase tracking-wider mb-1.5">Notes</h5>
                  <p className="text-sm text-primary-text bg-theme-bg p-3 border border-theme-border rounded-[12px] font-medium">
                    {viewingItem.notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-theme-border flex justify-between">
                <button
                  onClick={() => {
                    const itemToEdit = viewingItem;
                    setViewingItem(null);
                    openItemModal(itemToEdit);
                  }}
                  className="bg-primary-green text-white px-4 py-2 rounded-[12px] text-xs font-bold hover:bg-dark-green transition-theme flex items-center gap-1.5"
                >
                  <Edit size={14} />
                  Edit Item
                </button>
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 border border-theme-border text-xs text-secondary-text rounded-[12px] hover:bg-theme-bg transition-theme"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green">
                {editingItem ? 'Edit Item' : 'Add Packing Item'}
              </h3>
              <button onClick={closeItemModal} className="text-secondary-text hover:text-primary-text">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Toothbrush, Power Bank"
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-1">Priority</label>
                  <select
                    value={itemPriority}
                    onChange={(e) => setItemPriority(e.target.value)}
                    className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  >
                    <option value="ESSENTIAL">ESSENTIAL (Red badge)</option>
                    <option value="IMPORTANT">IMPORTANT (Orange badge)</option>
                    <option value="OPTIONAL">OPTIONAL (Green badge)</option>
                  </select>
                </div>
              </div>

              {/* Location fields */}
              <div className="bg-soft-mint/40 border border-theme-border p-4 rounded-[12px] space-y-3">
                <h4 className="text-xs font-black text-dark-green uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={12} />
                  Hierarchical Location Memory
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary-text mb-1">Room</label>
                    <input
                      type="text"
                      value={locationRoom}
                      onChange={(e) => setLocationRoom(e.target.value)}
                      placeholder="e.g. Bedroom"
                      className="block w-full border border-theme-border rounded-[11px] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-secondary-text mb-1">Furniture</label>
                    <input
                      type="text"
                      value={locationFurniture}
                      onChange={(e) => setLocationFurniture(e.target.value)}
                      placeholder="e.g. Study Table"
                      className="block w-full border border-theme-border rounded-[11px] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary-text mb-1">Drawer/Shelf</label>
                    <input
                      type="text"
                      value={locationShelf}
                      onChange={(e) => setLocationShelf(e.target.value)}
                      placeholder="e.g. Left Drawer"
                      className="block w-full border border-theme-border rounded-[11px] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary-text mb-1">Specific Details / Guide</label>
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder="e.g. Under the red notepad, near the charging socket"
                    className="block w-full border border-theme-border rounded-[11px] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                  />
                </div>

                {/* Photo Upload inside modal */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary-text mb-1">Add Location Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="photo-file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-file"
                      className="flex items-center gap-1.5 border border-theme-border bg-white hover:bg-theme-bg text-secondary-text text-xs font-semibold px-3 py-2 rounded-[12px] cursor-pointer transition-theme"
                    >
                      <Camera size={14} />
                      {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                    </label>
                    {itemPhotoUrl && (
                      <span className="text-xs text-primary-green font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Photo Attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">Item Notes</label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="e.g. Don't forget the charging cable!"
                  rows="2"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-theme-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="px-4 py-2 border border-theme-border text-sm text-secondary-text rounded-[12px] hover:bg-theme-bg transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 bg-primary-green hover:bg-dark-green text-white text-sm font-semibold rounded-[12px] transition-theme flex items-center gap-1.5"
                >
                  {savingItem ? <Loader2 size={16} className="animate-spin" /> : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
export { TripDetail };

