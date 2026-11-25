import React, { createContext, useContext, useState } from 'react';
import { SelectOption } from '../components/MotionPrimitives';
import { DateRangeOption } from '../types/analytics';

export type SiteId = 'mydeen.vercel.app' | 'mydeenblog.vercel.app' | 'all';

export const SITE_OPTIONS: SelectOption<SiteId>[] = [
  { value: 'mydeen.vercel.app', label: '1. mydeen.vercel.app' },
  { value: 'mydeenblog.vercel.app', label: '2. mydeenblog.vercel.app' },
  { value: 'all', label: 'All Sites' },
];

interface SiteContextValue {
  site: SiteId;
  setSite: (site: SiteId) => void;
  range: DateRangeOption;
  setRange: (range: DateRangeOption) => void;
  siteUrl: string;
  siteLabel: string;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

const STORAGE_KEY = 'mydeen-analytics-site';

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [site, setSiteState] = useState<SiteId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SiteId | null;
    if (
      saved === 'mydeen.vercel.app' ||
      saved === 'mydeenblog.vercel.app' ||
      saved === 'all'
    ) {
      return saved;
    }
    return 'mydeen.vercel.app';
  });

  const [range, setRange] = useState<DateRangeOption>('7d');

  const setSite = (next: SiteId) => {
    setSiteState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const siteUrl =
    site === 'mydeenblog.vercel.app'
      ? 'https://mydeenblog.vercel.app/'
      : 'https://mydeen.vercel.app/';

  const siteLabel =
    site === 'all'
      ? 'All Sites'
      : site === 'mydeenblog.vercel.app'
      ? 'mydeenblog.vercel.app'
      : 'mydeen.vercel.app';

  return (
    <SiteContext.Provider value={{ site, setSite, range, setRange, siteUrl, siteLabel }}>
      {children}
    </SiteContext.Provider>
  );
};

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used inside SiteProvider');
  }
  return ctx;
}
