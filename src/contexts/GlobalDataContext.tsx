import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import { getKnownEmails } from '../utils/api';
import { useAuth } from '../hooks/AuthProvider';
import { notifyError } from '../utils/notifications';

// Define action types
type Action =
  | { type: 'SET_EMAILS'; payload: string[] }
  | { type: 'CLEAR_EMAILS' };

// The state type
interface GlobalDataState {
  knownEmails: string[];
  // Future additional data properties...
}

// Create initial state
const initialState: GlobalDataState = {
  knownEmails: [],
};

// Reducer function to handle actions
const globalDataReducer = (
  state: GlobalDataState,
  action: Action,
): GlobalDataState => {
  switch (action.type) {
    case 'SET_EMAILS':
      return { ...state, knownEmails: action.payload };
    case 'CLEAR_EMAILS':
      return { ...state, knownEmails: [] };
    default:
      return state;
  }
};

interface GlobalDataContextType extends GlobalDataState {
  refreshKnownEmails: () => void;
  // Future actions and selectors can be added here
}

const GlobalDataContext = createContext<GlobalDataContextType>({
  ...initialState,
  refreshKnownEmails: () => {},
});

export const GlobalDataProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(globalDataReducer, initialState);

  const fetchKnownEmails = async () => {
    if (token) {
      try {
        const emails = await getKnownEmails(token);
        dispatch({ type: 'SET_EMAILS', payload: emails });
      } catch (error) {
        notifyError('Erreur lors de la récupération des emails connus');
        console.error('Error fetching known emails: ', error);
      }
    }
  };

  useEffect(() => {
    fetchKnownEmails();
  }, [token]);

  return (
    <GlobalDataContext.Provider
      value={{
        knownEmails: state.knownEmails,
        refreshKnownEmails: fetchKnownEmails,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export function useGlobalData(): GlobalDataContextType {
  return useContext(GlobalDataContext);
}
