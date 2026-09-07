'use client';
import React, { createContext, useContext } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isHandledLocally: boolean;
  setIsHandledLocally: (val: boolean) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      isHandledLocally: false,
      setIsHandledLocally: () => {},
    };
  }
  return context;
}
