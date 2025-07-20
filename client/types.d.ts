declare module 'react' {
  import * as React from 'react';
  
  export = React;
  export as namespace React;
  
  export default React;
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useContext: typeof React.useContext;
  export const useReducer: typeof React.useReducer;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  export const useImperativeHandle: typeof React.useImperativeHandle;
  export const useDebugValue: typeof React.useDebugValue;
  export const useId: typeof React.useId;
  export const useTransition: typeof React.useTransition;
  export const useDeferredValue: typeof React.useDeferredValue;
  export const useSyncExternalStore: typeof React.useSyncExternalStore;
  export const useInsertionEffect: typeof React.useInsertionEffect;
}

declare module 'lucide-react' {
  import { LucideIcon } from 'lucide-react';
  
  export const Calendar: LucideIcon;
  export const Clock: LucideIcon;
  export const Star: LucideIcon;
  export const MapPin: LucideIcon;
  export const Heart: LucideIcon;
  export const Search: LucideIcon;
  export const Filter: LucideIcon;
  export const Bell: LucideIcon;
  export const Settings: LucideIcon;
  export const User: LucideIcon;
  export const Scissors: LucideIcon;
  export const History: LucideIcon;
  export const Phone: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Edit: LucideIcon;
  export const Trash2: LucideIcon;
  export const Plus: LucideIcon;
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Gift: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Share2: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Mail: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Navigation: LucideIcon;
  export const Loader2: LucideIcon;
  export const Camera: LucideIcon;
  export const StarOff: LucideIcon;
  export const Upload: LucideIcon;
  export const Image: LucideIcon;
  export const Home: LucideIcon;
  export const Building: LucideIcon;
  export const Car: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Palette: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Zap: LucideIcon;
  export const Waves: LucideIcon;
  export const ArrowRight: LucideIcon;
}

declare module 'react-router-dom' {
  import { ComponentType } from 'react';
  
  export function Link(props: any): JSX.Element;
  export function useNavigate(): (to: string) => void;
}



 