import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useApp } from '@/contexts/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { role, viewMode } = useApp();
  
  // Hide bottom nav in family dashboard mode for children
  const showBottomNav = !(role === 'child' && viewMode === 'family');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className={`flex-1 overflow-auto ${showBottomNav ? 'pb-20' : 'pb-4'}`}>
        <div className="max-w-lg mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
};
