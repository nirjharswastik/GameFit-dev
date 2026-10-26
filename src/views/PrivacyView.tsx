import React from 'react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
          Legal & Privacy
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last revised: October 2026 · Draft for GameFit Public MVP
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Client-Side Data Processing</h2>
          <p>
            GameFit does not require account registration, passwords, or personal identifying information (PII). When you configure a hardware profile (such as selecting a CPU, GPU, or RAM capacity), this preference is stored solely in your web browser's local storage (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">localStorage</code>) on your own device.
          </p>
          <p>
            Your hardware specifications are never transmitted to a remote tracking server or sold to third-party data brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Cookies and Tracking Technologies</h2>
          <p>
            The GameFit MVP uses zero third-party advertising cookies or behavioral tracking pixels. All search, filtering, and compatibility comparisons occur locally inside your client application session.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Third-Party Storefront Links</h2>
          <p>
            GameFit may provide outbound links to official publisher storefronts (such as Steam, GOG, Google Play, or the Apple App Store) for data provenance and purchase verification. When you navigate away from GameFit, you become subject to the respective external platform's privacy policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Policy Updates and Inquiries</h2>
          <p>
            As GameFit introduces additional catalog services, this policy will be transparently updated. If you have questions regarding data handling or wish to clear your saved hardware rig, simply click "Reset to Default Rig" in the Hardware Profiler or clear your browser's site data.
          </p>
        </section>
      </div>
    </div>
  );
};
