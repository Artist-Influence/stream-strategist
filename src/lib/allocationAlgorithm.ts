import { Playlist, AllocationInput, AllocationResult } from "@/types";

export interface GenreMatch {
  playlist: Playlist;
  relevanceScore: number;
  genreMatch: number;
  streamScore: number;
}

/**
 * Calculate genre relevance score between playlist and campaign
 */
function calculateGenreRelevance(playlistGenres: string[], campaignGenre: string): number {
  if (playlistGenres.length === 0) return 0;
  
  // Direct match gets highest score
  if (playlistGenres.includes(campaignGenre)) return 1.0;
  
  // Partial matches for related genres
  const genreRelations: Record<string, string[]> = {
    "electronic": ["edm", "house", "techno", "dubstep", "synthwave", "future-bass"],
    "indie": ["indie-rock", "indie-pop", "bedroom-pop", "alt-rock"],
    "hip-hop": ["rap", "trap", "underground", "boom-bap"],
    "rock": ["indie-rock", "alt-rock", "punk", "metal"],
    "pop": ["indie-pop", "synth-pop", "electro-pop"],
    "r&b": ["soul", "neo-soul", "funk"],
    "folk": ["indie-folk", "acoustic", "singer-songwriter"],
  };
  
  const relatedGenres = genreRelations[campaignGenre] || [];
  const hasRelated = playlistGenres.some(genre => relatedGenres.includes(genre));
  
  if (hasRelated) return 0.7;
  
  // Check if campaign genre is in related genres of playlist genres
  for (const genre of playlistGenres) {
    const related = genreRelations[genre] || [];
    if (related.includes(campaignGenre)) return 0.6;
  }
  
  return 0.1; // Minimal relevance for no match
}

/**
 * Normalize stream count to 0-1 scale
 */
function normalizeStreamScore(streams: number, maxStreams: number): number {
  if (maxStreams === 0) return 0;
  return Math.min(streams / maxStreams, 1.0);
}

/**
 * Calculate overall relevance score for playlist matching
 */
function calculateRelevanceScore(
  playlist: Playlist,
  campaignGenre: string,
  maxStreams: number
): number {
  const genreMatch = calculateGenreRelevance(playlist.genres, campaignGenre);
  const streamScore = normalizeStreamScore(playlist.avg_daily_streams, maxStreams);
  
  // 50% genre relevance + 50% normalized stream performance
  return (genreMatch * 0.5) + (streamScore * 0.5);
}

/**
 * Main allocation algorithm - distributes streams across playlists
 */
export function allocateStreams(input: AllocationInput): {
  allocations: AllocationResult[];
  unfilled: number;
  genreMatches: GenreMatch[];
} {
  const { playlists, goal, vendorCaps, subGenre, durationDays } = input;
  
  if (playlists.length === 0 || goal <= 0) {
    return { allocations: [], unfilled: goal, genreMatches: [] };
  }
  
  // Calculate max streams for normalization
  const maxStreams = Math.max(...playlists.map(p => p.avg_daily_streams));
  
  // Score and sort playlists by relevance
  const genreMatches: GenreMatch[] = playlists.map(playlist => {
    const genreMatch = calculateGenreRelevance(playlist.genres, subGenre);
    const streamScore = normalizeStreamScore(playlist.avg_daily_streams, maxStreams);
    const relevanceScore = calculateRelevanceScore(playlist, subGenre, maxStreams);
    
    return {
      playlist,
      relevanceScore,
      genreMatch,
      streamScore
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Initialize tracking variables
  let remainingGoal = goal;
  const allocations: AllocationResult[] = [];
  const caps = { ...vendorCaps };
  
  // Allocate streams to playlists in order of relevance
  for (const match of genreMatches) {
    if (remainingGoal <= 0) break;
    
    const playlist = match.playlist;
    const vendorCap = caps[playlist.vendor_id] || 0;
    
    // Calculate max allocation for this playlist
    const playlistCapacity = playlist.avg_daily_streams * durationDays;
    const maxAllocation = Math.min(
      remainingGoal,
      vendorCap,
      playlistCapacity
    );
    
    if (maxAllocation > 0) {
      allocations.push({
        playlist_id: playlist.id,
        allocation: maxAllocation,
        vendor_id: playlist.vendor_id
      });
      
      remainingGoal -= maxAllocation;
      caps[playlist.vendor_id] = vendorCap - maxAllocation;
    }
  }
  
  return {
    allocations,
    unfilled: remainingGoal,
    genreMatches
  };
}

/**
 * Calculate projected performance metrics
 */
export function calculateProjections(allocations: AllocationResult[], playlists: Playlist[]) {
  const playlistMap = new Map(playlists.map(p => [p.id, p]));
  
  let totalStreams = 0;
  let totalDailyStreams = 0;
  const vendorBreakdown: Record<string, number> = {};
  
  for (const allocation of allocations) {
    const playlist = playlistMap.get(allocation.playlist_id);
    if (playlist) {
      totalStreams += allocation.allocation;
      totalDailyStreams += playlist.avg_daily_streams;
      vendorBreakdown[allocation.vendor_id] = 
        (vendorBreakdown[allocation.vendor_id] || 0) + allocation.allocation;
    }
  }
  
  return {
    totalStreams,
    totalDailyStreams,
    vendorBreakdown,
    playlistCount: allocations.length
  };
}

/**
 * Validate allocation constraints
 */
export function validateAllocations(
  allocations: AllocationResult[], 
  vendorCaps: Record<string, number>,
  playlists: Playlist[],
  durationDays: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const playlistMap = new Map(playlists.map(p => [p.id, p]));
  const vendorTotals: Record<string, number> = {};
  
  for (const allocation of allocations) {
    const playlist = playlistMap.get(allocation.playlist_id);
    if (!playlist) {
      errors.push(`Playlist ${allocation.playlist_id} not found`);
      continue;
    }
    
    // Check playlist capacity
    const playlistCapacity = playlist.avg_daily_streams * durationDays;
    if (allocation.allocation > playlistCapacity) {
      errors.push(`Allocation exceeds capacity for playlist ${playlist.name}`);
    }
    
    // Track vendor totals
    vendorTotals[allocation.vendor_id] = 
      (vendorTotals[allocation.vendor_id] || 0) + allocation.allocation;
  }
  
  // Check vendor caps
  for (const [vendorId, total] of Object.entries(vendorTotals)) {
    const cap = vendorCaps[vendorId] || 0;
    if (total > cap) {
      errors.push(`Vendor allocation exceeds daily cap: ${total} > ${cap}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}