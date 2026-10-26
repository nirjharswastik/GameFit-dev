import React, { useEffect, useState } from 'react';
import { useHardware } from '../../context/HardwareContext';
import { IconClose, IconMonitor, IconSearch, IconSmartphone } from '../common/Icons';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const { hardware, openHardwareModal } = useHardware();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Discover', path: '/discover' },
    { label: 'Games', path: '/games' },
    { label: 'Compatibility', path: '/compatibility' },
  ];

  const secondaryLinks = [
    { label: 'Data Sources', path: '/sources' },
    { label: 'About', path: '/about' },
  ];

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F6F5F1] border-b border-[#DCDCD4]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-[72px]">
          {/* Left: Wordmark & Center-Left: Primary Navigation */}
          <div className="flex items-center gap-10">
            {/* Typographic wordmark */}
            <button
              onClick={() => handleNavClick('/')}
              className="text-xl sm:text-2xl font-bold tracking-tight text-[#20211F] hover:text-[#C85B38] transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85B38] rounded"
            >
              Game<span className="text-[#C85B38]">Fit</span>
            </button>

            {/* Primary Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#686A64]">
              {navLinks.map(link => {
                const isActive = currentPath === link.path || (link.path === '/games' && currentPath.startsWith('/game/'));
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive ? 'text-[#20211F] font-semibold' : 'hover:text-[#20211F]'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#C85B38]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search + Active Rig Action */}
          <div className="flex items-center gap-3">
            {/* Search shortcut button */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else handleNavClick('/games');
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-[#686A64] hover:text-[#20211F] bg-[#EEEDE7] hover:bg-[#E8E7E0] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer"
              title="Search catalog"
            >
              <IconSearch className="w-3.5 h-3.5 text-[#85867F]" />
              <span className="font-medium">Search</span>
              <kbd className="font-mono text-[10px] text-[#85867F] bg-white px-1.5 py-0.5 rounded border border-[#DCDCD4]">
                /
              </kbd>
            </button>

            {/* Active Device Rig Trigger */}
            <button
              onClick={openHardwareModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#20211F] bg-white hover:bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85B38]"
              title="Configure device hardware profile"
            >
              {hardware.platform === 'pc' ? (
                <IconMonitor className="w-3.5 h-3.5 text-[#C85B38]" />
              ) : (
                <IconSmartphone className="w-3.5 h-3.5 text-[#C85B38]" />
              )}
              <span className="hidden sm:inline text-[#686A64]">Rig:</span>
              <span className="font-semibold text-[#20211F] max-w-[120px] sm:max-w-[160px] truncate">
                {hardware.name}
              </span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-[#20211F] hover:bg-[#EEEDE7] rounded-[8px] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#DCDCD4] bg-[#F6F5F1] animate-in fade-in-50 duration-150">
            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => handleNavClick('/')}
                className="text-left py-2 px-3 text-sm font-semibold text-[#20211F] hover:bg-[#EEEDE7] rounded-[8px] cursor-pointer"
              >
                Home
              </button>
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className="text-left py-2 px-3 text-sm font-medium text-[#20211F] hover:bg-[#EEEDE7] rounded-[8px] cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 border-t border-[#E8E7E0] flex flex-col space-y-2">
                {secondaryLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    className="text-left py-1.5 px-3 text-xs text-[#686A64] hover:text-[#20211F] cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
