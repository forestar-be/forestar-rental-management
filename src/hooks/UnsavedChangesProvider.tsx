import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface UnsavedChangesContextValue {
  confirmNavigation: () => boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

const UnsavedChangesProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const confirmNavigation = useCallback(
    () =>
      !hasUnsavedChanges ||
      window.confirm(
        'Des modifications ne sont pas enregistrées. Voulez-vous quitter cette page ?',
      ),
    [hasUnsavedChanges],
  );
  const value = useMemo(
    () => ({ confirmNavigation, setHasUnsavedChanges }),
    [confirmNavigation],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      'useUnsavedChanges must be used within UnsavedChangesProvider',
    );
  }
  return context;
};

export default UnsavedChangesProvider;
