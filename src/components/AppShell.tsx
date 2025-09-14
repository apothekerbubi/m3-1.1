'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SideNav from '@/components/SideNav';
import GlobalSkeleton from '@/components/GlobalSkeleton';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <div>
        <Suspense fallback={<GlobalSkeleton />}>{children}</Suspense>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[var(--nav-w)_1fr] items-start">
          <aside className="hidden md:block">
            <div className="sticky top-20">
              <SideNav />
            </div>
          </aside>
          <div>
            <Suspense fallback={<GlobalSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

