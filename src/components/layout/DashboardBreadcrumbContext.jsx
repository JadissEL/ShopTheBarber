import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const DashboardBreadcrumbTitleContext = createContext({
  dynamicTitle: null,
  setDynamicTitle: () => {},
});

export function DashboardBreadcrumbProvider({ children }) {
  const location = useLocation();
  const [dynamicTitle, setDynamicTitle] = useState(null);

  useEffect(() => {
    setDynamicTitle(null);
  }, [location.pathname, location.search]);

  return (
    <DashboardBreadcrumbTitleContext.Provider value={{ dynamicTitle, setDynamicTitle }}>
      {children}
    </DashboardBreadcrumbTitleContext.Provider>
  );
}

export function useDashboardBreadcrumbTitle() {
  return useContext(DashboardBreadcrumbTitleContext).dynamicTitle;
}

/** Override the current breadcrumb label on detail pages (e.g. barber name). */
export function useSetBreadcrumbTitle(title) {
  const { setDynamicTitle } = useContext(DashboardBreadcrumbTitleContext);

  useEffect(() => {
    if (!title) {
      setDynamicTitle(null);
      return undefined;
    }
    setDynamicTitle(title);
    return () => setDynamicTitle(null);
  }, [title, setDynamicTitle]);
}
