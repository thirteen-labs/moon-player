import { useContext } from 'react';
import { AudioLibraryContext } from './AudioLibraryContext';
import type { AudioLibraryContextValue } from './AudioLibraryContext';

export function useAudioLibrary(): AudioLibraryContextValue {
  const context = useContext(AudioLibraryContext);
  if (!context) {
    throw new Error('useAudioLibrary must be used within an AudioLibraryProvider');
  }
  return context;
}
