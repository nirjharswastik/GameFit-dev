import React from 'react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10">
      <div className="border-b border-[#DCDCD4] pb-6 space-y-2">
        <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
          PRODUCT MISSION & IDENTITY
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
          About GameFit
        </h1>
        <p className="text-sm text-[#686A64] max-w-2xl leading-relaxed">
          GameFit was created to solve a persistent friction in PC and mobile gaming: spending hours searching for a game, purchasing or downloading gigabytes of assets, only to discover it stutters uncontrollably on your hardware.
        </p>
      </div>

      <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 sm:p-8 space-y-5 text-sm text-[#20211F] leading-relaxed shadow-xs">
        <h2 className="font-editorial text-2xl font-bold text-[#20211F]">
          The Problem We Solve
        </h2>
        <p className="text-[#686A64]">
          System requirement aggregators across the internet are often cluttered with ad trackers, inflated synthetic benchmark scores, and deceptive promises that "your system will run this at 60 FPS!" In reality, modern games frequently face CPU bottlenecks in dense scenes or VRAM exhaustion that minimum requirements don't make obvious.
        </p>
        <p className="text-[#686A64]">
          GameFit unites discovery and compatibility into one calm, editorial experience. When a game exceeds your hardware's comfort zone, GameFit doesn't leave you stranded with a generic failure message; it highlights verified alternatives that match the atmosphere, world design, and combat feel of that title while running smoothly on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#20211F]">
        <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-3 shadow-xs">
          <span className="font-bold text-sm text-[#20211F] block">What GameFit Does</span>
          <ul className="space-y-2 text-[#686A64]">
            <li>· Transcribes verified developer minimum and recommended specifications.</li>
            <li>· Enables instant client-side testing of real PC and mobile hardware setups.</li>
            <li>· Identifies the primary hardware bottleneck (GPU, CPU, RAM, or Storage).</li>
            <li>· Ranks playable alternatives by game feel similarity and hardware headroom.</li>
          </ul>
        </div>

        <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-3 shadow-xs">
          <span className="font-bold text-sm text-[#20211F] block">What GameFit Never Does</span>
          <ul className="space-y-2 text-[#686A64]">
            <li>· Never fabricates live FPS numbers without verified benchmark logs.</li>
            <li>· Never presents missing data as confirmed compatibility.</li>
            <li>· Never forces account creation or collects personal device identifiers.</li>
            <li>· Never recommends fake, AI-invented video games.</li>
          </ul>
        </div>
      </div>

      <div className="p-6 bg-[#F6E8E1] border border-[#C85B38]/30 rounded-[10px] text-xs text-[#20211F] space-y-2">
        <span className="font-bold text-[#C85B38] block text-sm">Open & Free Product Focus</span>
        <p className="text-[#686A64] leading-relaxed">
          GameFit is built around genuine user value using client-side deterministic algorithms and structured open datasets. Future sustainability will focus on genuine utility rather than intrusive user tracking or deceptive affiliate placements.
        </p>
      </div>
    </div>
  );
};
