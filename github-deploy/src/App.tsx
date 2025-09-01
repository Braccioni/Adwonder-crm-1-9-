import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import SystemStatus from './components/SystemStatus';
import { Toaster } from 'react-hot-toast';
import { startHealthMonitoring } from './utils/healthCheck';

// Lazy load dei componenti
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const ClientList = lazy(() => import('./components/Clients/ClientList'));
const DealList = lazy(() => import('./components/Deals/DealList'));
const ActivityList = lazy(() => import('./components/Activities/ActivityList'));
const Reports = lazy(() => import('./components/Reports/Reports'));
const Operations = lazy(() => import('./components/Operations/Operations'));
const UserManagement = lazy(() => import('./components/Admin/UserManagement'));

// Error Boundary Component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Qualcosa è andato storto</h1>
              <p className="text-gray-600 mb-4">
                Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Ricarica Pagina
              </button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">Dettagli errore</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Avvia il monitoraggio dello stato del sistema
  React.useEffect(() => {
    const stopMonitoring = startHealthMonitoring(60000); // Ogni minuto
    return stopMonitoring;
  }, []);

  const renderContent = () => {
    const ComponentMap = {
      dashboard: Dashboard,
      clients: ClientList,
      deals: DealList,
      activities: ActivityList,
      reports: Reports,
      operations: Operations,
      'user-management': UserManagement,
    };
    
    const Component = ComponentMap[activeTab as keyof typeof ComponentMap] || Dashboard;
    
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64">Caricamento...</div>}>
        <Component />
      </Suspense>
    );
  };

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <div className="flex h-screen bg-gray-100">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Barra di stato del sistema */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold text-gray-900 capitalize">
                    {activeTab === 'user-management' ? 'User Management' : activeTab}
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <SystemStatus 
                    showDetails={showSystemStatus}
                    className="text-sm"
                  />
                  <button
                    onClick={() => setShowSystemStatus(!showSystemStatus)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    title="Toggle system status details"
                  >
                    {showSystemStatus ? '▼' : '▶'}
                  </button>
                </div>
              </div>
              
              {showSystemStatus && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <SystemStatus showDetails={true} />
                </div>
              )}
            </div>
            
            {/* Contenuto principale */}
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-600">Caricamento...</p>
                  </div>
                </div>
              }>
                {renderContent()}
              </Suspense>
            </div>
          </main>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;