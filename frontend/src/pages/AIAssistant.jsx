import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';
import { useAI } from '../context/AIContext';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Plus,
  Check,
  RefreshCw,
  MapPin,
  Luggage,
  RotateCcw
} from 'lucide-react';

const AIAssistant = () => {
  const {
    activeTab,
    setActiveTab,
    destination,
    setDestination,
    duration,
    setDuration,
    tripDesc,
    setTripDesc,
    suggestions,
    setSuggestions,
    addedIds,
    setAddedIds,
    selectedTripId,
    setSelectedTripId,
    messages,
    setMessages,
    chatInput,
    setChatInput,
    clearChat,
    resetAll
  } = useAI();

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [trips, setTrips] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await client.get('/trips');
        setTrips(res.data);
        if (res.data.length > 0 && !selectedTripId) {
          const firstTrip = res.data[0];
          setSelectedTripId(firstTrip.id);
          if (!destination) {
            setDestination(firstTrip.destination || '');
          }
          if (!duration && firstTrip.startDate && firstTrip.endDate) {
            const start = new Date(firstTrip.startDate);
            const end = new Date(firstTrip.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setDuration(`${diffDays} days`);
          }
          if (!tripDesc) {
            setTripDesc(firstTrip.description || '');
          }
        }
      } catch (err) {
        console.error("Failed to load trips for AI context", err);
      }
    };
    fetchTrips();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGetSuggestions = async (e) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoadingSuggestions(true);
    setSuggestions([]);
    setAddedIds(new Set());

    try {
      const res = await client.post('/ai/packing-suggestions', {
        destination: destination.trim(),
        duration: duration.trim(),
        description: tripDesc.trim(),
        tripId: selectedTripId ? parseInt(selectedTripId) : null
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to get AI suggestions", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestion = async (item) => {
    if (!selectedTripId) {
      alert("Please select a trip first.");
      return;
    }
    try {
      await client.post(`/trips/${selectedTripId}/items`, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        priority: item.priority,
        packed: false
      });
      setAddedIds(prev => new Set([...prev, item.id]));
    } catch (err) {
      console.error("Failed to add suggestion to trip", err);
    }
  };

  const handleAddAllSuggestions = async () => {
    if (!selectedTripId) {
      alert("Please select a trip first.");
      return;
    }
    for (const item of suggestions) {
      if (!addedIds.has(item.id)) {
        await handleAddSuggestion(item);
      }
    }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMsg = { id: Date.now(), role: 'user', text: chatInput.trim() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoadingChat(true);

    // Build trip context string
    const selectedTrip = trips.find(t => t.id === parseInt(selectedTripId));
    const tripContext = selectedTrip
      ? `Trip: ${selectedTrip.name} | Destination: ${selectedTrip.destination} | Dates: ${selectedTrip.startDate} to ${selectedTrip.endDate}`
      : 'No specific trip selected.';

    const conversationHistory = updatedMessages.map(msg => ({
      role: msg.role,
      text: msg.text
    }));

    try {
      const res = await client.post('/ai/chat', {
        question: userMsg.text,
        tripContext,
        tripId: selectedTripId ? parseInt(selectedTripId) : null,
        history: conversationHistory
      });
      const botMsg = { id: Date.now() + 1, role: 'assistant', text: res.data.answer };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = { id: Date.now() + 1, role: 'assistant', text: "Sorry, I couldn't process that right now. Please try again in a moment." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const quickPrompts = [
    "What should I pack for a beach trip?",
    "What to keep in cabin bag for a flight?",
    "What documents do I need for international travel?",
    "What if it rains at my destination?"
  ];

  const getPriorityColor = (p) => {
    switch (p) {
      case 'ESSENTIAL': return 'bg-red-50 text-[#EF4444] border-red-100';
      case 'IMPORTANT': return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
      default: return 'bg-light-green text-dark-green border-[#A7F3D0]';
    }
  };

  return (
    <div className="space-y-6 pb-16 md:pb-8 font-sans">
      <div className="border-b border-theme-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text flex items-center gap-2">
            <Sparkles size={28} className="text-primary-green" />
            AI Packing Assistant
          </h1>
          <p className="text-sm text-secondary-text mt-1">Get smart packing suggestions and travel tips powered by AI.</p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to reset all AI Assistant history and inputs?")) {
              resetAll();
            }
          }}
          title="Reset AI Session"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary-text hover:text-red-600 bg-white border border-theme-border hover:border-red-200 rounded-[11px] transition-theme shrink-0"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Reset Session</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white border border-theme-border p-1 rounded-[12px] w-fit">
        <button
          onClick={() => setActiveTab('suggest')}
          className={`px-5 py-2 text-xs font-bold rounded-[12px] transition-theme flex items-center gap-1.5 ${activeTab === 'suggest' ? 'bg-light-green text-dark-green font-semibold' : 'text-secondary-text hover:text-primary-text font-semibold'}`}
        >
          <Sparkles size={14} />
          Generate Suggestions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-5 py-2 text-xs font-bold rounded-[12px] transition-theme flex items-center gap-1.5 ${activeTab === 'chat' ? 'bg-light-green text-dark-green font-semibold' : 'text-secondary-text hover:text-primary-text font-semibold'}`}
        >
          <Bot size={14} />
          Ask AI Anything
        </button>
      </div>

      {activeTab === 'suggest' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Panel */}
          <div className="lg:col-span-2 bg-white border border-theme-border rounded-[18px] shadow-sm p-6 space-y-4 h-fit">
            <h3 className="font-bold text-dark-green text-sm uppercase tracking-wider">Trip Details</h3>
            <form onSubmit={handleGetSuggestions} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-text mb-1 uppercase">Destination / Trip Type</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Beach Goa, Mountain Ladakh"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-text mb-1 uppercase">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 5 days, 2 weeks"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-text mb-1 uppercase">Additional Details</label>
                <textarea
                  value={tripDesc}
                  onChange={e => setTripDesc(e.target.value)}
                  placeholder="Staying at hotel, flying, expect rainy weather..."
                  rows="3"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loadingSuggestions}
                className="w-full bg-primary-green text-white py-2.5 rounded-[12px] font-semibold hover:bg-dark-green transition-theme flex items-center justify-center gap-2"
              >
                {loadingSuggestions ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loadingSuggestions ? 'Generating...' : 'Generate Suggestions'}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            {loadingSuggestions ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-theme-border rounded-[18px] shadow-sm">
                <Loader2 size={36} className="animate-spin text-primary-green mb-3" />
                <p className="text-sm text-secondary-text font-semibold">AI is crafting your personalized list...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="bg-white border border-theme-border rounded-[18px] shadow-sm overflow-hidden">
                <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <h3 className="font-bold text-dark-green flex items-center gap-2">
                    <Sparkles size={18} />
                    AI Suggested Packing List ({suggestions.length} items)
                  </h3>
                  <div className="flex gap-2 items-center">
                    {trips.length > 0 && (
                      <select
                        value={selectedTripId}
                        onChange={e => {
                          const newTripId = e.target.value;
                          setSelectedTripId(newTripId);
                          const trip = trips.find(t => t.id === parseInt(newTripId));
                          if (trip) {
                            setDestination(trip.destination || '');
                            if (trip.startDate && trip.endDate) {
                              const start = new Date(trip.startDate);
                              const end = new Date(trip.endDate);
                              const diffTime = Math.abs(end - start);
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              setDuration(`${diffDays} days`);
                            } else {
                              setDuration('');
                            }
                            setTripDesc(trip.description || '');
                          }
                        }}
                        className="border border-theme-border rounded-[11px] bg-white text-xs font-semibold px-2 py-1.5 text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green"
                      >
                        {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    )}
                    <button
                      onClick={handleAddAllSuggestions}
                      className="text-xs font-bold bg-primary-green text-white px-3 py-1.5 rounded-[12px] hover:bg-dark-green transition-theme flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add All
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-themeBorder max-h-[480px] overflow-y-auto">
                  {suggestions.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-theme-bg/40 transition-theme">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-semibold text-primary-text">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-secondary-text bg-theme-bg px-2 py-0.5 rounded-full border border-theme-border">{item.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                          {item.quantity > 1 && <span className="text-[10px] text-secondary-text">x{item.quantity}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(item)}
                        disabled={addedIds.has(item.id)}
                        className={`p-2 rounded-[12px] border transition-theme shrink-0 ${
                          addedIds.has(item.id)
                            ? 'bg-light-green border-primaryGreen/30 text-dark-green cursor-default'
                            : 'border-theme-border hover:bg-light-green hover:border-primary-green/30 text-secondary-text hover:text-dark-green'
                        }`}
                      >
                        {addedIds.has(item.id) ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-theme-border rounded-[18px] shadow-sm text-center px-6">
                <div className="w-16 h-16 bg-soft-mint text-dark-green rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-base font-bold text-primary-text">Enter your trip details</h3>
                <p className="text-xs text-secondary-text mt-1 max-w-xs">Fill the form on the left to get AI-powered packing suggestions tailored to your destination and travel style.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-sm overflow-hidden flex flex-col" style={{ height: '65vh' }}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-light-green text-dark-green' : 'bg-primary-green text-white'}`}>
                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[75%] px-4 py-3 rounded-[18px] text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-soft-mint border border-theme-border text-primary-text'
                      : 'bg-primary-green text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-light-green flex items-center justify-center"><Bot size={16} className="text-dark-green" /></div>
                  <div className="bg-soft-mint border border-theme-border px-4 py-3 rounded-[18px]">
                    <Loader2 size={16} className="animate-spin text-primary-green" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-5 py-3 border-t border-theme-border bg-theme-bg flex gap-2 overflow-x-auto">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setChatInput(prompt)}
                  className="text-[11px] whitespace-nowrap bg-white border border-theme-border text-secondary-text hover:text-dark-green hover:border-primary-green/30 px-3 py-1.5 rounded-full font-semibold transition-theme"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleChatSend} className="flex gap-3 p-4 border-t border-theme-border bg-white items-center">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask anything about your trip..."
                className="flex-1 border border-theme-border rounded-[11px] bg-theme-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
              />
              <button
                type="submit"
                disabled={loadingChat || !chatInput.trim()}
                className="bg-primary-green text-white w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-dark-green transition-theme disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;

