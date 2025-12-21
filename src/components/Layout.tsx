import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
