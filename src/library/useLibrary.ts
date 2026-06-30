import { useContext } from 'react';
import { LibraryContext } from './LibraryContext';
import type { LibraryContextValue } from './LibraryContext';

export function useLibrary(): LibraryContextValue {
  return useContext(LibraryContext);
}
