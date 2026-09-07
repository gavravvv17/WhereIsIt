import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const AIContext = createContext(null);

const DEFAULT_MESSAGES = [
  {
    id: 0,
    role: 'assistant',
    text: "Hi! I'm the WhereIsIt Assistant. Tell me about your trip and I'll help you figure out what to pack. You can also ask me anything about travel, baggage allowances, weather, or safety tips!"
  }
];

export const AIProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `smart_packing_ai_state_${user?.id || 'anonymous'}`;

  // Helper to load initial state from localStorage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          activeTab: parsed.activeTab || 'suggest',
          destination: parsed.destination || '',
          duration: parsed.duration || '',
          tripDesc: parsed.tripDesc || '',
          suggestions: parsed.suggestions || [],
          addedIds: new Set(parsed.addedIds || []),
          selectedTripId: parsed.selectedTripId || '',
          messages: parsed.messages && parsed.messages.length > 0 ? parsed.messages : DEFAULT_MESSAGES,
          chatInput: parsed.chatInput || ''
        };
      }
    } catch (e) {
      console.error("Failed to load AI state from localStorage", e);
    }
    return {
      activeTab: 'suggest',
      destination: '',
      duration: '',
      tripDesc: '',
      suggestions: [],
      addedIds: new Set(),
      selectedTripId: '',
      messages: DEFAULT_MESSAGES,
      chatInput: ''
    };
  };

  const initialState = loadSavedState();

  const [activeTab, setActiveTab] = useState(initialState.activeTab);
  const [destination, setDestination] = useState(initialState.destination);
  const [duration, setDuration] = useState(initialState.duration);
  const [tripDesc, setTripDesc] = useState(initialState.tripDesc);
  const [suggestions, setSuggestions] = useState(initialState.suggestions);
  const [addedIds, setAddedIds] = useState(initialState.addedIds);
  const [selectedTripId, setSelectedTripId] = useState(initialState.selectedTripId);
  const [messages, setMessages] = useState(initialState.messages);
  const [chatInput, setChatInput] = useState(initialState.chatInput);

  // Reload state if user changes
  useEffect(() => {
    const loaded = loadSavedState();
    setActiveTab(loaded.activeTab);
    setDestination(loaded.destination);
    setDuration(loaded.duration);
    setTripDesc(loaded.tripDesc);
    setSuggestions(loaded.suggestions);
    setAddedIds(loaded.addedIds);
    setSelectedTripId(loaded.selectedTripId);
    setMessages(loaded.messages);
    setChatInput(loaded.chatInput);
  }, [user?.id]);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        activeTab,
        destination,
        duration,
        tripDesc,
        suggestions,
        addedIds: Array.from(addedIds),
        selectedTripId,
        messages,
        chatInput
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save AI state to localStorage", e);
    }
  }, [activeTab, destination, duration, tripDesc, suggestions, addedIds, selectedTripId, messages, chatInput, storageKey]);

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    setChatInput('');
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setAddedIds(new Set());
  };

  const resetAll = () => {
    setActiveTab('suggest');
    setDestination('');
    setDuration('');
    setTripDesc('');
    setSuggestions([]);
    setAddedIds(new Set());
    setSelectedTripId('');
    setMessages(DEFAULT_MESSAGES);
    setChatInput('');
    localStorage.removeItem(storageKey);
  };

  return (
    <AIContext.Provider
      value={{
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
        clearSuggestions,
        resetAll
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export default AIContext;
