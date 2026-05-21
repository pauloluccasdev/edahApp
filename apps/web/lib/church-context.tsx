'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Church {
  churchId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
}

interface ChurchContextValue {
  churches: Church[];
  activeChurch: Church | null;
  setActiveChurch: (church: Church) => void;
  isLoading: boolean;
}

const ChurchContext = createContext<ChurchContextValue>({
  churches: [],
  activeChurch: null,
  setActiveChurch: () => {},
  isLoading: true,
});

const STORAGE_KEY = 'edah_active_church_id';

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [activeChurch, setActiveChurchState] = useState<Church | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me/churches');
        if (!res.ok) return;
        const data: Church[] = await res.json();
        setChurches(data);

        const storedId = localStorage.getItem(STORAGE_KEY);
        const stored = data.find((c) => c.churchId === storedId);
        setActiveChurchState(stored ?? data[0] ?? null);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const setActiveChurch = useCallback((church: Church) => {
    setActiveChurchState(church);
    localStorage.setItem(STORAGE_KEY, church.churchId);
  }, []);

  return (
    <ChurchContext.Provider value={{ churches, activeChurch, setActiveChurch, isLoading }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  return useContext(ChurchContext);
}
