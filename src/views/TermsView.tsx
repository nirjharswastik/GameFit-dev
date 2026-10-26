import React from 'react';

export const TermsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
          Terms & Disclaimers
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last revised: October 2026 · Standard Public Terms
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Nature of the Service</h2>
          <p>
            GameFit provides game discovery, genre exploration, and hardware compatibility assessments based on publicly released publisher manifests and hardware architecture tiers. GameFit is an informational resource and does not sell or distribute game software.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Hardware Compatibility Disclaimer</h2>
          <p>
            Meeting a game's published "minimum requirements" signifies that the game was officially deemed runnable by its publisher at base resolution and minimal quality settings. It does not represent an absolute guarantee of 60 frames per second, flawless stability, or support for thermal-throttled mobile or laptop hardware.
          </p>
          <p>
            Real-world performance can be influenced by background software, operating system patch levels, thermal cooling performance, driver updates, and display resolutions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Intellectual Property & Trademarks</h2>
          <p>
            All game titles, character names, cover imagery, and developer/publisher marks displayed on GameFit are the property of their respective copyright holders. Their display within GameFit is solely for editorial reference, compatibility cataloging, and identification purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Limitation of Liability</h2>
          <p>
            GameFit is provided free of charge on an "as is" and "as available" basis without warranties of any kind. GameFit shall not be held liable for game purchasing decisions, unplayable titles, or hardware issues resulting from software execution.
          </p>
        </section>
      </div>
    </div>
  );
};
