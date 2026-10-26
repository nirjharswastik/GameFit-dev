import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-20 border-t border-[#DCDCD4] bg-[#EEEDE7]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <span className="text-xl font-bold tracking-tight text-[#20211F]">
              Game<span className="text-[#C85B38]">Fit</span>
            </span>
            <p className="text-xs sm:text-sm text-[#686A64] max-w-md leading-relaxed">
              An independent game discovery and hardware compatibility platform helping players discover games matching their interests, evaluate device compatibility, and find suitable alternatives that fit their hardware.
            </p>
            <p className="text-xs text-[#85867F]">
              Direct publisher provenance · Zero fabricated frame rates · Non-sponsored hardware evaluations
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#85867F] block mb-3">
              Explore & Tools
            </span>
            <ul className="space-y-2 text-xs text-[#686A64]">
              <li>
                <button onClick={() => onNavigate('/discover')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Discover by Experience
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/games')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Game Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/compatibility')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Hardware Compatibility Checker
                </button>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#85867F] block mb-3">
              Integrity & Information
            </span>
            <ul className="space-y-2 text-xs text-[#686A64]">
              <li>
                <button onClick={() => onNavigate('/sources')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Data Sources & Provenance
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  About GameFit
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-[#20211F] transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Small Data Accuracy Disclaimer & Copyright */}
        <div className="pt-8 border-t border-[#DCDCD4] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#85867F] gap-4">
          <p className="max-w-xl leading-relaxed">
            Data accuracy notice: System requirements are transcribed from verified publisher manifests and storefront documentation. Meeting published minimums signifies base operational feasibility, not guaranteed 60 FPS in all environments.
          </p>
          <div className="flex items-center gap-4 text-[11px] shrink-0 font-mono">
            <span>GameFit Independent Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
