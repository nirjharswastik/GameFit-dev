/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { HardwareModal } from './components/hardware/HardwareModal';
import { Footer } from './components/navigation/Footer';
import { Navbar } from './components/navigation/Navbar';
import { HardwareProvider } from './context/HardwareContext';
import { CURATED_GAMES } from './data/games';
import { Game } from './types';
import { AboutView } from './views/AboutView';
import { AlternativesView } from './views/AlternativesView';
import { CatalogView } from './views/CatalogView';
import { CompatibilityView } from './views/CompatibilityView';
import { DiscoveryView } from './views/DiscoveryView';
import { GameDetailView } from './views/GameDetailView';
import { HomeView } from './views/HomeView';
import { PrivacyView } from './views/PrivacyView';
import { SourcesView } from './views/SourcesView';
import { TermsView } from './views/TermsView';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return (window.location.pathname || '/') + (window.location.search || '');
  });

  const [catalogInitialQuery, setCatalogInitialQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [catalogInitialCompatibleOnly, setCatalogInitialCompatibleOnly] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fit') === 'true';
  });

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const full = (window.location.pathname || '/') + (window.location.search || '');
      setCurrentPath(full);
      const params = new URLSearchParams(window.location.search);
      if (params.has('q')) setCatalogInitialQuery(params.get('q') || '');
      if (params.has('fit')) setCatalogInitialCompatibleOnly(params.get('fit') === 'true');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectGame = (game: Game) => {
    navigateTo(`/game/${game.slug}`);
  };

  const handleViewAlternatives = (game: Game) => {
    navigateTo(`/alternatives/${game.slug}`);
  };

  const handleSearchSubmit = (query: string, compatibleOnly: boolean) => {
    setCatalogInitialQuery(query);
    setCatalogInitialCompatibleOnly(compatibleOnly);
    const searchParams = new URLSearchParams();
    if (query.trim()) searchParams.set('q', query.trim());
    if (compatibleOnly) searchParams.set('fit', 'true');
    const paramStr = searchParams.toString();
    const targetUrl = paramStr ? `/games?${paramStr}` : '/games';
    navigateTo(targetUrl);
  };

  // Route dispatcher
  const renderActiveView = () => {
    const pathname = currentPath.split('?')[0];

    // 1. Home
    if (pathname === '/' || pathname === '') {
      return (
        <HomeView
          onSelectGame={handleSelectGame}
          onNavigate={navigateTo}
          onSearchSubmit={handleSearchSubmit}
        />
      );
    }

    // 2. Catalog
    if (pathname === '/games' || pathname === '/catalog') {
      return (
        <CatalogView
          onSelectGame={handleSelectGame}
          initialQuery={catalogInitialQuery}
          initialCompatibleOnly={catalogInitialCompatibleOnly}
        />
      );
    }

    // 3. Compatibility Checker
    if (pathname === '/compatibility') {
      return (
        <CompatibilityView
          onSelectGame={handleSelectGame}
          onViewAlternatives={handleViewAlternatives}
        />
      );
    }

    // 4. Discovery
    if (pathname === '/discover' || pathname === '/discovery') {
      return (
        <DiscoveryView
          onSelectGame={handleSelectGame}
          onNavigate={navigateTo}
        />
      );
    }

    // 5. Game Detail: /game/:slug
    if (pathname.startsWith('/game/')) {
      const slug = pathname.replace('/game/', '').trim();
      const matchedGame = CURATED_GAMES.find(g => g.slug === slug);
      if (matchedGame) {
        return (
          <GameDetailView
            game={matchedGame}
            onSelectGame={handleSelectGame}
            onNavigate={navigateTo}
            onViewAlternatives={handleViewAlternatives}
          />
        );
      }
      return (
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
          <h2 className="font-editorial text-2xl font-bold text-[#20211F]">Game Not Found</h2>
          <p className="text-xs text-[#686A64]">The game slug "{slug}" was not found in our curated catalog.</p>
          <button
            onClick={() => navigateTo('/games')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C85B38] rounded-[8px] cursor-pointer"
          >
            Browse Verified Catalog
          </button>
        </div>
      );
    }

    // 6. Alternatives: /alternatives/:slug
    if (pathname.startsWith('/alternatives/')) {
      const slug = pathname.replace('/alternatives/', '').trim();
      const matchedGame = CURATED_GAMES.find(g => g.slug === slug) || CURATED_GAMES[0];
      return (
        <AlternativesView
          baseGame={matchedGame}
          onSelectGame={handleSelectGame}
          onNavigate={navigateTo}
        />
      );
    }

    // 7. Sources
    if (pathname === '/sources' || pathname === '/data-sources') {
      return <SourcesView />;
    }

    // 8. About
    if (pathname === '/about') {
      return <AboutView />;
    }

    // 9. Privacy
    if (pathname === '/privacy') {
      return <PrivacyView />;
    }

    // 10. Terms
    if (pathname === '/terms') {
      return <TermsView />;
    }

    // Default Fallback
    return (
      <HomeView
        onSelectGame={handleSelectGame}
        onNavigate={navigateTo}
        onSearchSubmit={handleSearchSubmit}
      />
    );
  };

  return (
    <HardwareProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 antialiased selection:bg-amber-100 selection:text-amber-900 font-sans">
        <Navbar currentPath={currentPath} onNavigate={navigateTo} />
        <main className="flex-1">
          {renderActiveView()}
        </main>
        <Footer onNavigate={navigateTo} />
        <HardwareModal />
      </div>
    </HardwareProvider>
  );
}
