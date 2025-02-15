import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import { getKnownEmails, getAllMachineRented } from '../utils/api';
import { useAuth } from '../hooks/AuthProvider';
import { notifyError } from '../utils/notifications';
import { MachineRentedWithImage } from '../utils/types';

// Define action types
type Action =
  | { type: 'SET_EMAILS'; payload: string[] }
  | { type: 'CLEAR_EMAILS' }
  | { type: 'SET_MACHINE_RENTED_LIST'; payload: MachineRentedWithImage[] }
  | { type: 'SET_LOADING_MACHINE_RENTED_LIST'; payload: boolean };

// The state type
interface GlobalDataState {
  knownEmails: string[];
  machineRentedList: MachineRentedWithImage[];
  loadingMachineRentedList: boolean;
}

// Create initial state
const initialState: GlobalDataState = {
  knownEmails: [],
  machineRentedList: [],
  loadingMachineRentedList: false,
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
    case 'SET_MACHINE_RENTED_LIST':
      return { ...state, machineRentedList: action.payload };
    case 'SET_LOADING_MACHINE_RENTED_LIST':
      return { ...state, loadingMachineRentedList: action.payload };
    default:
      return state;
  }
};

interface GlobalDataContextType extends GlobalDataState {
  refreshKnownEmails: () => void;
  refreshMachineRentedList: () => void;
}

const GlobalDataContext = createContext<GlobalDataContextType>({
  ...initialState,
  refreshKnownEmails: () => {},
  refreshMachineRentedList: () => {},
});

export const GlobalDataProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(globalDataReducer, initialState);

  const refreshKnownEmails = async () => {
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

  const refreshMachineRentedList = async () => {
    if (token) {
      dispatch({ type: 'SET_LOADING_MACHINE_RENTED_LIST', payload: true });
      try {
        const machines = await getAllMachineRented(token, true);
        dispatch({ type: 'SET_MACHINE_RENTED_LIST', payload: machines });
      } catch (error) {
        notifyError('Erreur lors de la récupération des machines louées');
        console.error('Error fetching machine rented list: ', error);
      } finally {
        dispatch({ type: 'SET_LOADING_MACHINE_RENTED_LIST', payload: false });
      }
    }
  };

  useEffect(() => {
    refreshKnownEmails();
  }, [token]);

  useEffect(() => {
    refreshMachineRentedList();
  }, [token]);

  return (
    <GlobalDataContext.Provider
      value={{
        knownEmails: state.knownEmails,
        machineRentedList: state.machineRentedList,
        loadingMachineRentedList: state.loadingMachineRentedList,
        refreshKnownEmails,
        refreshMachineRentedList,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export function useGlobalData(): GlobalDataContextType {
  return useContext(GlobalDataContext);
}
