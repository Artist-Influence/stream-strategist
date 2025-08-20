// Minimal allocation algorithm utilities to satisfy current usage
// Restores deleted module and provides simple, deterministic behavior

import type { Playlist, Vendor } from "@/types";

export interface GenreMatch {
  playlist: Playlist;
  relevanceScore: number; // 0..1
}

export interface LearningInsights {
  confidenceScore: number; // 0..1
  expectedPerformance: {
    optimistic: number;
    realistic: number;
    conservative: number;
  };
  recommendations: string[];
  riskFactors: string[];
}

// Input shape used by AIRecommendations
interface AllocateStreamsInput {
  playlists: Playlist[];
  goal: number;
  vendorCaps: Record<string, number>; // total capacity over campaign window
  subGenre: string;
  durationDays: number;
  vendors?: Vendor[];
  campaignBudget?: number;
  campaignGenres?: string[];
}

// Output allocation item
interface AllocationItem {
  playlist_id: string;
  vendor_id: string;
  allocation: number;
}

// Helper: compute a basic relevance score using genres + stream volume
function computeRelevance(playlist: Playlist, subGenre: string, campaignGenres?: string[]): number {
  const hasExact = playlist.genres.includes(subGenre) ? 1 : 0;
  const overlap = (campaignGenres || []).filter(g => playlist.genres.includes(g)).length;
  const overlapScore = Math.min(overlap / Math.max((campaignGenres || []).length || 1, 1), 1);
  // Normalize stream influence (soft cap at 50k)
  const volumeScore = Math.min(playlist.avg_daily_streams / 50000, 1);
  // Weighted blend
  const score = 0.55 * hasExact + 0.25 * overlapScore + 0.20 * volumeScore;
  return Math.max(0, Math.min(score, 1));
}

export async function allocateStreams(input: AllocateStreamsInput): Promise<{
  allocations: AllocationItem[];
  genreMatches: GenreMatch[];
  insights: LearningInsights;
}> {
  const { playlists, goal, vendorCaps, subGenre, durationDays, campaignGenres } = input;

  // Build genre matches
  const genreMatches: GenreMatch[] = playlists.map(p => ({
    playlist: p,
    relevanceScore: computeRelevance(p, subGenre, campaignGenres),
  }));

  // Sort playlists by relevance then by avg_daily_streams desc
  const sorted = [...genreMatches].sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (b.playlist.avg_daily_streams || 0) - (a.playlist.avg_daily_streams || 0);
  });

  // Greedy allocation respecting vendor caps and simple playlist capacity
  const remainingByVendor: Record<string, number> = { ...vendorCaps };
  let remainingGoal = Math.max(0, goal);
  const allocations: AllocationItem[] = [];

  for (const match of sorted) {
    if (remainingGoal <= 0) break;
    const p = match.playlist;
    const vendorId = p.vendor_id;

    const vendorRemaining = Math.max(0, remainingByVendor[vendorId] ?? Infinity);
    if (vendorRemaining <= 0) continue;

    // Simple per-playlist capacity = avg_daily_streams * durationDays
    const playlistCapacity = Math.max(0, Math.floor((p.avg_daily_streams || 0) * durationDays));
    if (playlistCapacity <= 0) continue;

    const allocationAmount = Math.min(remainingGoal, vendorRemaining, playlistCapacity);
    if (allocationAmount <= 0) continue;

    allocations.push({ playlist_id: p.id, vendor_id: vendorId, allocation: allocationAmount });
    remainingGoal -= allocationAmount;
    remainingByVendor[vendorId] = vendorRemaining - allocationAmount;
  }

  // Basic insights for the UI card
  const allocatedTotal = allocations.reduce((sum, a) => sum + a.allocation, 0);
  const coverage = goal > 0 ? allocatedTotal / goal : 0;
  const insights: LearningInsights = {
    confidenceScore: Math.max(0.4, Math.min(0.95, 0.6 + (coverage - 0.5) * 0.5)),
    expectedPerformance: {
      optimistic: Math.round(allocatedTotal * 1.15),
      realistic: Math.round(allocatedTotal * 0.95),
      conservative: Math.round(allocatedTotal * 0.8),
    },
    recommendations: coverage < 1
      ? [
          "Increase vendor caps or extend campaign duration to reach goal.",
          "Add more playlists in closely related sub-genres for better coverage.",
        ]
      : ["Allocations meet or exceed target — proceed to review and confirm."],
    riskFactors: [
      ...(coverage < 0.7 ? ["Low projected coverage vs stream goal."] : []),
      ...(sorted.length === 0 ? ["No playlists match the selected genre filters."] : []),
    ],
  };

  return { allocations, genreMatches, insights };
}

export function calculateProjections(
  selectedAllocations: AllocationItem[],
  playlists: Playlist[]
): { totalStreams: number; byPlaylist: Record<string, number> } {
  // In this minimal version, projections equal requested allocations
  const byPlaylist: Record<string, number> = {};
  for (const a of selectedAllocations) {
    byPlaylist[a.playlist_id] = (byPlaylist[a.playlist_id] || 0) + a.allocation;
  }
  const totalStreams = Object.values(byPlaylist).reduce((s, n) => s + n, 0);
  return { totalStreams, byPlaylist };
}

export function validateAllocations(
  selectedAllocations: AllocationItem[],
  vendorCaps: Record<string, number>,
  playlists: Playlist[],
  durationDays: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Map playlist -> vendor and compute per-playlist cap
  const playlistMap = new Map<string, Playlist>();
  playlists.forEach(p => playlistMap.set(p.id, p));

  // Per-vendor totals
  const byVendor: Record<string, number> = {};
  for (const a of selectedAllocations) {
    const playlist = playlistMap.get(a.playlist_id);
    if (!playlist) {
      errors.push(`Unknown playlist in allocation: ${a.playlist_id}`);
      continue;
    }

    if (a.allocation < 0 || !Number.isFinite(a.allocation)) {
      errors.push(`Invalid allocation for ${playlist.name}`);
    }

    // Check per-playlist capacity
    const cap = Math.max(0, Math.floor((playlist.avg_daily_streams || 0) * durationDays));
    if (a.allocation > cap) {
      errors.push(`Allocation for ${playlist.name} exceeds playlist capacity (${cap.toLocaleString()}).`);
    }

    const vendorId = playlist.vendor_id;
    byVendor[vendorId] = (byVendor[vendorId] || 0) + a.allocation;
  }

  // Check vendor caps
  for (const [vendorId, total] of Object.entries(byVendor)) {
    const cap = vendorCaps[vendorId] ?? Infinity;
    if (total > cap) {
      errors.push(`Vendor ${vendorId} exceeded cap (${total.toLocaleString()} > ${cap.toLocaleString()}).`);
    }
  }

  return { isValid: errors.length === 0, errors };
}
