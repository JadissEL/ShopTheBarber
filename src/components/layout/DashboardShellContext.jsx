import { createContext, useContext } from 'react';

const DashboardShellContext = createContext(false);

/** Marks content rendered inside ClientLayout, ProviderLayout, or AdminLayout. */
export function DashboardShellProvider({ children, active = true }) {
  return (
    <DashboardShellContext.Provider value={Boolean(active)}>
      {children}
    </DashboardShellContext.Provider>
  );
}

export function useDashboardShell() {
  return useContext(DashboardShellContext);
}
