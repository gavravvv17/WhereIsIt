import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  Compass,
  ArrowLeft,
  Loader2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Check,
  MapPin
} from 'lucide-react';

const PackingMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justPackedId, setJustPackedId] = useState(null);

  const fetchTripItems = async () => {
    try {
      setLoading(true);
      const [tripRes, itemsRes] = await Promise.all([
        client.get(`/trips/${id}`),
        client.get(`/trips/${id}/items`)
      ]);
      setTrip(tripRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to load items in packing mode", err);
      navigate(`/trips/${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripItems();
  }, [id]);

  const handleTogglePack = async (itemId, currentPacked) => {
    try {
      if (!currentPacked) {
        setJustPackedId(itemId);
        // Play subtle custom trigger or feedback delay
        setTimeout(() => setJustPackedId(null), 600);
      }

      // Optimistic update
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, packed: !item.packed } : item));
      const res = await client.patch(`/items/${itemId}/pack`);

      // Recalculate progress locally
      setTrip(prev => {
        const nextPacked = prev.packedItems + (res.data.packed ? 1 : -1);
        return {
          ...prev,
          packedItems: nextPacked,
          progressPercent: prev.totalItems > 0 ? Math.round((nextPacked / prev.totalItems) * 100) : 0
        };
      });
    } catch (err) {
      console.error("Failed to pack item", err);
      fetchTripItems();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-green" />
      </div>
    );
  }

  // Filter items in categories
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

  const groupedItems = {};
  categories.forEach(cat => {
    const catItems = items.filter(item => item.category === cat);
    if (catItems.length > 0) {
      groupedItems[cat] = catItems;
    }
  });

  const allPacked = items.length > 0 && items.every(item => item.packed);

  return (
    <div className="min-h-screen bg-theme-bg pb-20 font-sans">
      {/* Top minimalistic header */}
      <header className="bg-white border-b border-theme-border sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/trips/${id}`)}
          className="flex items-center gap-1.5 text-secondary-text hover:text-dark-green font-semibold text-sm transition-theme"
        >
          <ArrowLeft size={16} />
          Exit Focus Mode
        </button>
        <span className="text-sm font-bold text-dark-green uppercase tracking-wide truncate max-w-[180px]">
          {trip?.name}
        </span>
        <div className="w-16"></div> {/* Spacer */}
      </header>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Progress Card */}
        <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-5 text-center">
          {allPacked ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <div className="w-12 h-12 bg-primary-green text-white rounded-full flex items-center justify-center nav-shadow animate-bounce">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-black text-dark-green uppercase">You are fully packed!</h3>
              <p className="text-xs text-secondary-text">Have a safe and wonderful trip!</p>
            </div>
          ) : (
            <>
              <span className="text-2xl font-black text-dark-green">
                {trip?.progressPercent}% Packed
              </span>
              <p className="text-xs text-secondary-text font-bold mt-1">
                {trip?.packedItems} of {trip?.totalItems} items checked off
              </p>
              <div className="w-full bg-theme-bg border border-theme-border h-3 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-primary-green h-full rounded-full transition-all duration-300"
                  style={{ width: `${trip?.progressPercent}%` }}
                ></div>
              </div>
            </>
          )}
        </div>

        {/* Packing Checklist */}
        <div className="space-y-4">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-12 bg-white border border-theme-border rounded-[18px] shadow-sm">
              <p className="text-sm text-secondary-text">Your packing list is empty.</p>
              <button
                onClick={() => navigate(`/trips/${id}`)}
                className="mt-3 bg-primary-green text-white px-4 py-2 rounded-[12px] text-xs font-bold hover:bg-dark-green"
              >
                Go Add Items
              </button>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-black text-dark-green uppercase tracking-wider pl-2 mt-4">{category}</h4>
                <div className="bg-white border border-theme-border rounded-[18px] shadow-sm divide-y divide-themeBorder overflow-hidden">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePack(item.id, item.packed)}
                      className={`flex items-center gap-4 p-4 active:bg-light-green/20 transition-theme cursor-pointer select-none ${
                        item.packed ? 'bg-theme-bg/40' : 'bg-white'
                      }`}
                    >
                      {/* Oversized Checkbox for simple thumb checking */}
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-theme ${
                          item.packed
                            ? 'bg-primary-green border-primaryGreen text-white nav-shadow scale-95'
                            : 'border-theme-border bg-theme-bg'
                        } ${justPackedId === item.id ? 'animate-check' : ''}`}
                      >
                        {item.packed && <Check size={18} className="stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-base font-semibold text-primary-text transition-theme ${
                          item.packed ? 'line-through text-secondary-text font-medium' : ''
                        }`}>
                          {item.name}
                          {item.quantity > 1 && <span className="ml-2 text-xs font-bold text-secondary-text">x{item.quantity}</span>}
                        </p>
                        
                        {item.locationRoom && (
                          <p className="text-[11px] text-secondary-text mt-0.5 truncate font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-primary-green inline" />
                            <span>
                              Keep in: {item.locationRoom}
                              {item.locationFurniture && ` → ${item.locationFurniture}`}
                            </span>
                          </p>
                        )}
                      </div>

                      {item.priority === 'ESSENTIAL' && !item.packed && (
                        <span className="text-[10px] font-extrabold uppercase bg-red-100 text-[#EF4444] border border-red-200 px-2 py-0.5 rounded-full">
                          Essential
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingMode;
export { PackingMode };

