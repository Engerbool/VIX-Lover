import React, { useState } from 'react';
import { NAV_ITEMS } from './constants';
import { View } from './types';
import Hero from './components/Hero';
import DistributionView from './components/DistributionView';
import CorrelationView from './components/CorrelationView';
import FuturesView from './components/FuturesView';
import DataSourceSelector from './components/DataSourceSelector';
import { DataSourceProvider } from './context/DataSourceContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DISTRIBUTION);

  const renderContent = () => {
    switch (currentView) {
      case View.DISTRIBUTION:
        return <DistributionView />;
      case View.CORRELATION:
        return <CorrelationView />;
      case View.FUTURES:
        return <FuturesView />;
      case View.TBD1:
      case View.TBD2:
        return (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <div className="text-center">
                    <p className="text-4xl font-mono font-bold opacity-20">TBD</p>
                    <p className="text-sm mt-2">Coming Soon</p>
                </div>
            </div>
        );
      default:
        return <DistributionView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-white/30 selection:text-white">
      {/* Interactive Hero */}
      <section className="relative z-10 border-b border-zinc-900/50">
        <Hero />
      </section>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-zinc-950/60 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Data Source Selector */}
            <div className="hidden sm:block">
              <DataSourceSelector />
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-2 sm:space-x-8 items-center overflow-x-auto no-scrollbar flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`
                  relative px-5 py-2 text-sm font-bold transition-all duration-500 whitespace-nowrap rounded-full
                  ${
                    currentView === item.id
                      ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white/20'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {/* Text with "Inner Light" effect */}
                <span className={currentView === item.id ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : ""}>
                    {item.label}
                </span>
                
                {/* Active Indicator - Intense Light Beam */}
                {currentView === item.id && (
                  <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-100 shadow-[0_0_15px_white]"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                  </div>
                )}
              </button>
            ))}
            </div>

            {/* Spacer for symmetry */}
            <div className="hidden sm:block w-[120px]"></div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-h-[600px] shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] relative overflow-hidden group">
            {/* Ambient Light Bloom */}
            <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-3xl pointer-events-none"></div>
            
            {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 bg-zinc-950 relative overflow-hidden">
        {/* Top light line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-500 text-xs relative z-10">
          <p>© 2024 VIX Lover. All data is delayed by 15 minutes.</p>
          <p className="mt-2">Designed for advanced volatility analysis.</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataSourceProvider>
      <AppContent />
    </DataSourceProvider>
  );
};

export default App;