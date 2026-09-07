import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { API_BASE_URL } from '../api/client';
import {
  Search,
  MapPin,
  Calendar,
  Luggage,
  Loader2,
  AlertCircle,
  Eye,
  Camera,
  CornerRightDown
} from 'lucide-react';

const FindItems = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await client.get(`/items/find?query=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
    } catch (err) {
      console.error("Failed to find items", err);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTimeString = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    return `Updated ${diffDays} days ago`;
  };

  return (
    <div className="space-y-6 pb-16 md:pb-8 font-sans max-w-3xl mx-auto w-full md:-translate-x-16">
      <div className="border-b border-theme-border pb-4 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text flex items-center justify-center gap-2">
          Find My Items
        </h1>
        <p className="text-sm text-secondary-text mt-1">Locate items across all past and current packing lists.</p>
      </div>

      {/* Large Search Section */}
      <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-6 md:p-8 text-center w-full">
        <h2 className="text-lg md:text-xl font-bold text-dark-green mb-3">Where did you keep something?</h2>
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
              <Search size={20} />
            </span>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Passport, Charger, Headphones, etc."
              className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm md:text-base font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-green text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow text-sm md:text-base flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Results grid */}
      <div className="w-full mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={36} className="animate-spin text-primary-green" />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="bg-white border border-theme-border rounded-[18px] shadow-sm p-8 text-center py-12 max-w-md mx-auto">
            <AlertCircle size={32} className="mx-auto text-[#F59E0B] mb-3" />
            <h3 className="text-base font-bold text-primary-text">Item not found</h3>
            <p className="text-xs text-secondary-text mt-1">
              We couldn't find any items matching "{query}" with a saved location. Try searching for synonyms or add location memory to items in your packing lists.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-theme-border rounded-[18px] shadow-sm hover:shadow-md hover:border-primary-green/20 transition-theme p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary-text uppercase tracking-wide">{item.name}</h3>
                      <span className="text-[10px] font-bold text-secondary-text bg-theme-bg px-2 py-0.5 rounded-full border border-theme-border uppercase">
                        {item.category}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/trips/${item.tripId}`)}
                      className="text-xs font-semibold text-primary-green hover:text-dark-green transition-theme flex items-center gap-1 bg-soft-mint px-2.5 py-1 rounded-full border border-primaryGreen/15"
                    >
                      <Luggage size={12} />
                      View Trip
                    </button>
                  </div>

                  {/* Hierarchical Location memory output */}
                  <div className="bg-soft-mint/40 border border-theme-border p-4 rounded-[12px] space-y-3">
                    <h4 className="text-xs font-black text-dark-green uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} />
                      Last Saved Location
                    </h4>
                    
                    {item.locationRoom ? (
                      <div className="text-sm font-semibold text-primary-text space-y-2">
                        <div className="flex items-center flex-wrap gap-1 text-xs">
                          <span className="bg-white px-2 py-0.5 rounded-[12px] border border-theme-border">{item.locationRoom}</span>
                          {item.locationFurniture && (
                            <>
                              <span className="text-secondary-text font-normal">&rarr;</span>
                              <span className="bg-white px-2 py-0.5 rounded-[12px] border border-theme-border">{item.locationFurniture}</span>
                            </>
                          )}
                          {item.locationShelf && (
                            <>
                              <span className="text-secondary-text font-normal">&rarr;</span>
                              <span className="bg-white px-2 py-0.5 rounded-[12px] border border-theme-border">{item.locationShelf}</span>
                            </>
                          )}
                        </div>

                        {item.locationDetails && (
                          <p className="text-xs font-normal text-secondary-text italic bg-white p-2 border border-theme-border rounded-[12px]">
                            "{item.locationDetails}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary-text italic">No detailed location saved.</p>
                    )}
                  </div>

                  {/* Location Photo */}
                  {item.photoUrl && (
                    <div className="mt-4">
                      <h4 className="text-xs font-black text-dark-green uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Camera size={12} />
                        Saved Photo
                      </h4>
                      <div className="border border-theme-border rounded-[12px] overflow-hidden max-h-36">
                        <img
                          src={`${API_BASE_URL}${item.photoUrl}`}
                          alt="Storage spot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-secondary-text mt-4 bg-theme-bg p-2.5 border border-theme-border rounded-[12px]">
                      <strong>Notes:</strong> {item.notes}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-theme-border flex items-center justify-between text-xs text-secondary-text">
                  <span className="flex items-center gap-1 uppercase tracking-wider font-semibold text-[10px]">
                    <Luggage size={12} />
                    Trip: {item.tripName}
                  </span>
                  <span>{getRelativeTimeString(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 bg-soft-mint text-dark-green rounded-full flex items-center justify-center mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-base font-bold text-primary-text">Search location memories</h3>
            <p className="text-xs text-secondary-text mt-1 max-w-sm">
              Type the name of any item above (like "passport" or "keys") to retrieve its specific storage spot instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindItems;

