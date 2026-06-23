import { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Report, Message } from '../types';

// Connect to backend server
const socket: Socket = io('http://localhost:3001');

// --- State ---
interface AppState {
  reports: Report[];
  isLoaded: boolean;
}

const defaultInitialState: AppState = {
  reports: [],
  isLoaded: false,
};

// --- Actions ---
type AppAction =
  | { type: 'SYNC_STATE'; payload: AppState }
  // We keep these actions for local optimistic updates if needed, 
  // but mostly we rely on SYNC_STATE from the server.
  | { type: 'ADD_REPORT'; payload: Report }
  | { type: 'ADD_MESSAGE'; payload: { reportId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { reportId: string; messageId: string; status: 'sent' | 'failed' } }
  | { type: 'UPDATE_STATUS'; payload: { reportId: string; status: Report['status'] } }
  | { type: 'UPDATE_CITIZEN_NAME'; payload: { reportId: string; name: string } };

// --- Reducer ---
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SYNC_STATE':
      return { ...state, reports: action.payload.reports, isLoaded: true };

    // Optimistic UI updates
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };

    case 'ADD_MESSAGE': {
      return {
        ...state,
        reports: state.reports.map((r) => {
          if (r.id === action.payload.reportId) {
            return {
              ...r,
              messages: [...r.messages, action.payload.message],
              attachments: action.payload.message.attachments ? [...r.attachments, ...action.payload.message.attachments] : r.attachments,
            };
          }
          return r;
        }),
      };
    }

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.payload.reportId
            ? {
                ...r,
                messages: r.messages.map((m) =>
                  m.id === action.payload.messageId ? { ...m, status: action.payload.status } : m
                ),
              }
            : r
        ),
      };

    case 'UPDATE_STATUS':
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.payload.reportId ? { ...r, status: action.payload.status } : r
        ),
      };

    case 'UPDATE_CITIZEN_NAME':
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.payload.reportId ? { ...r, citizenName: action.payload.name } : r
        ),
      };

    default:
      return state;
  }
}

// --- Context ---
interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  addReport: (report: Report) => void;
  addMessage: (reportId: string, message: Message) => void;
  updateMessageStatus: (reportId: string, messageId: string, status: 'sent' | 'failed') => void;
  updateReportStatus: (reportId: string, status: Report['status']) => void;
  updateCitizenName: (reportId: string, name: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultInitialState);

  useEffect(() => {
    // 1. Fetch initial data via REST API
    fetch('http://localhost:3001/api/reports')
      .then(res => res.json())
      .then(data => {
        dispatch({ type: 'SYNC_STATE', payload: { reports: data } });
      })
      .catch(err => {
        console.error("Failed to fetch initial state", err);
        // Dispatch to set isLoaded to true even if it fails, to avoid infinite loading
        dispatch({ type: 'SYNC_STATE', payload: { reports: [] } });
      });

    // 2. Listen to WebSocket updates
    socket.on('stateUpdate', (data: Report[]) => {
      dispatch({ type: 'SYNC_STATE', payload: { reports: data } });
    });

    return () => {
      socket.off('stateUpdate');
    };
  }, []);

  const addReport = (report: Report) => {
    // Optimistic UI
    dispatch({ type: 'ADD_REPORT', payload: report });
    // Send to Backend
    socket.emit('addReport', report);
  };

  const addMessage = (reportId: string, message: Message) => {
    // Optimistic UI
    dispatch({ type: 'ADD_MESSAGE', payload: { reportId, message } });
    // Send to Backend
    socket.emit('addMessage', { reportId, message });
  };

  const updateMessageStatus = (reportId: string, messageId: string, status: 'sent' | 'failed') => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { reportId, messageId, status } });
    // (Optional) We aren't tracking 'sending' state permanently in backend, it usually resolves instantly locally
  };

  const updateReportStatus = (reportId: string, status: Report['status']) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { reportId, status } });
    socket.emit('updateReportStatus', { reportId, status });
  };

  const updateCitizenName = (reportId: string, name: string) => {
    dispatch({ type: 'UPDATE_CITIZEN_NAME', payload: { reportId, name } });
    socket.emit('updateCitizenName', { reportId, name });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addReport, addMessage, updateMessageStatus, updateReportStatus, updateCitizenName }}>
      {children}
    </AppContext.Provider>
  );
}

// --- Hook ---
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
