'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type InstructorModeContextValue = {
  isInstructorMode: boolean;
  setIsInstructorMode: (value: boolean) => void;
};

const InstructorModeContext = createContext<InstructorModeContextValue | undefined>(undefined);

export function InstructorModeProvider({ children }: { children: ReactNode }) {
  const [isInstructorMode, setIsInstructorMode] = useState(false);

  const value = useMemo(
    () => ({
      isInstructorMode,
      setIsInstructorMode,
    }),
    [isInstructorMode]
  );

  return <InstructorModeContext.Provider value={value}>{children}</InstructorModeContext.Provider>;
}

export function useInstructorMode() {
  const context = useContext(InstructorModeContext);

  if (!context) {
    throw new Error('useInstructorMode must be used within an InstructorModeProvider');
  }

  return context;
}
