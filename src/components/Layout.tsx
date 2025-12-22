import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  // Mobile: show bottom nav, Desktop: show sidebar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto pb-20">
          <div className="w-full px-4 py-4">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Desktop: sidebar layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border h-14 flex items-center px-4 gap-4">
            <SidebarTrigger />
            <Header />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="w-full px-6 py-4 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
