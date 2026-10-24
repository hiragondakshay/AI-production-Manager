import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const [shiftData, setShiftData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  
  // Track shift code to detect boundary transitions
  const currentShiftCodeRef = useRef(null);

  const fetchShiftStatus = useCallback(async (isTransitionCheck = false) => {
    try {
      const res = await api.get('/enterprise/shifts/current');
      const data = res.data;
      setShiftData(data);
      setSecondsRemaining(data.next_shift.seconds_remaining);
      setLastRefreshedAt(new Date());

      // Detect if shift boundary crossed
      if (currentShiftCodeRef.current && currentShiftCodeRef.current !== data.active_shift.code) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 5000);
      }
      currentShiftCodeRef.current = data.active_shift.code;
    } catch (err) {
      console.error('Failed to sync factory shift status:', err);
    }
  }, []);

  // Initial fetch and 60s background sync
  useEffect(() => {
    fetchShiftStatus();
    const syncInterval = setInterval(() => fetchShiftStatus(false), 60000);
    return () => clearInterval(syncInterval);
  }, [fetchShiftStatus]);

  // High precision 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Boundary reached! Auto-refresh shift state immediately
          fetchShiftStatus(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchShiftStatus]);

  // Format live countdown HH:MM:SS
  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeShift = shiftData?.active_shift || {
    name: 'Night Shift',
    code: 'night',
    formatted_range: '10:00 PM – 06:00 AM (Next Day)',
    color: '#A855F7',
    start_time: '22:00',
    end_time: '06:00',
    progress_percentage: 25.0
  };

  const nextShift = shiftData?.next_shift || {
    name: 'Morning Shift',
    code: 'morning',
    formatted_range: '06:00 AM – 02:00 PM',
    countdown_formatted: '06:40:00',
    countdown_message: 'Next shift starts in 06:40:00'
  };

  const countdownFormatted = formatCountdown(secondsRemaining);

  const value = {
    shiftData,
    activeShift,
    nextShift,
    secondsRemaining,
    countdownFormatted,
    isTransitioning,
    lastRefreshedAt,
    refreshShiftStatus: () => fetchShiftStatus(false)
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
