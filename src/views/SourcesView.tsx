import React from 'react';
import { IconCheck, IconExternalLink, IconInfo } from '../components/common/Icons';
import { CURATED_GAMES } from '../data/games';

export const SourcesView: React.FC = () => {
  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10">
      <div className="border-b border-[#DCDCD4] pb-6 space-y-2">
        <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
          TRANSPARENCY & DATA PROVENANCE
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
          Data sources & verification methodology
        </h1>
        <p className="text-sm text-[#686A64] max-w-2xl leading-relaxed">
          GameFit is founded on the principle that gamers deserve verifiable facts. We do not extrapolate system requirements using unverified generative guessing, nor do we fabricate FPS benchmarks.
        </p>
      </div>

      {/* Methodology Section */}
      <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="font-editorial text-2xl font-bold text-[#20211F]">
          Our Data Ingestion Standard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#686A64] leading-relaxed">
          <div className="p-4 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] space-y-2">
            <span className="font-bold text-[#20211F] block text-sm">1. Official Manifests</span>
            <p>
              Requirements are transcribed directly from first-party developer documentation, patch notes, Steam, GOG, and App Store storefronts.
            </p>
          </div>
          <div className="p-4 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] space-y-2">
            <span className="font-bold text-[#20211F] block text-sm">2. Silicon Tier Mapping</span>
            <p>
              Processors and graphics cards are indexed using public microarchitecture generation data (e.g., IPC, rasterization compute, memory bandwidth).
            </p>
          </div>
          <div className="p-4 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] space-y-2">
            <span className="font-bold text-[#20211F] block text-sm">3. Explicit Uncertainty</span>
            <p>
              If a publisher has not published verified minimum specifications for a given platform, GameFit flags the result as Uncertain instead of inventing specs.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Games Table */}
      <div className="bg-white border border-[#DCDCD4] rounded-[10px] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E8E7E0] bg-[#F6F5F1]">
          <h2 className="font-editorial text-xl font-bold text-[#20211F]">
            Curated Catalog Provenance Log ({CURATED_GAMES.length} Titles)
          </h2>
          <p className="text-xs text-[#85867F] mt-0.5">
            Every record contains a direct link to the publisher's published requirements and last audit timestamp.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEEDE7] text-[#20211F] font-semibold border-b border-[#DCDCD4]">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Developer</th>
                <th className="py-3 px-4">Audit Source</th>
                <th className="py-3 px-4">Last Verified</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E7E0] text-[#686A64]">
              {CURATED_GAMES.map(game => (
                <tr key={game.id} className="hover:bg-[#F6F5F1]/80">
                  <td className="py-3.5 px-4 font-semibold text-[#20211F] whitespace-nowrap">
                    {game.title}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{game.developer}</td>
                  <td className="py-3.5 px-4">
                    {game.provenance.sourceUrl ? (
                      <a
                        href={game.provenance.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#C85B38] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span className="truncate max-w-[200px]">{game.provenance.sourceName}</span>
                        <IconExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span>{game.provenance.sourceName}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#85867F] whitespace-nowrap">
                    {game.provenance.lastVerified}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[#2F6B50] bg-[#2F6B50]/10 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border border-[#2F6B50]/20">
                      <IconCheck className="w-3 h-3 text-[#2F6B50]" />
                      {game.provenance.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
