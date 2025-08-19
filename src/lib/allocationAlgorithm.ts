import { Playlist, AllocationInput, AllocationResult, Vendor } from "@/types";

export interface GenreMatch {
  playlist: Playlist;
  relevanceScore: number;
  genreMatch: number;
  streamScore: number;
  capacityEstimated?: boolean;
  estimatedCapacity?: number;
}

/**
 * Enhanced genre relations for electronic music and comprehensive mappings
 */
const GENRE_RELATIONS: Record<string, string[]> = {
  // Electronic sub-genres with cross-relations
  "phonk": ["phonk", "drift phonk", "cowbell phonk"],
  "tech house": ["tech house", "house", "techno", "minimal tech"],
  "techno": ["techno", "tech house", "minimal", "industrial techno", "acid techno"],
  "minimal": ["minimal", "techno", "tech house", "minimal tech"],
  "house": ["house", "tech house", "deep house", "progressive house", "bass house"],
  "progressive house": ["progressive house", "house", "trance", "progressive trance"],
  "bass house": ["bass house", "house", "electro house", "big room"],
  "big room": ["big room", "house", "electro house", "festival"],
  "afro house": ["afro house", "house", "afrobeats", "deep house"],
  "afrobeats": ["afrobeats", "afro house", "afro beat", "african"],
  "hardstyle": ["hardstyle", "hardcore", "rawstyle", "euphoric hardstyle"],
  "dubstep": ["dubstep", "melodic dubstep", "brostep", "future bass"],
  "trap": ["electronic trap", "edm trap", "future trap", "bass"],
  "melodic bass": ["melodic bass", "future bass", "melodic dubstep"],
  "trance": ["trance", "progressive trance", "uplifting trance", "psytrance"],
  "dance": ["dance", "club", "disco", "eurodance", "edm"],
  
  // Traditional genres
  "pop": ["pop", "indie pop", "synth pop", "electro pop", "dance pop"],
  "indie": ["indie", "indie rock", "indie pop", "bedroom pop", "alt rock"],
  "alternative": ["alternative", "alt rock", "grunge", "britpop", "indie rock"],
  "rock": ["rock", "indie rock", "alt rock", "punk", "metal", "hard rock"],
  "hip-hop": ["hip hop", "rap", "trap music", "drill", "boom bap"],
  "r&b": ["r&b", "soul", "neo soul", "funk", "contemporary r&b"],
  "country": ["country", "alt-country", "americana", "bluegrass"],
  "jazz": ["jazz", "smooth jazz", "bebop", "fusion"],
  "folk": ["folk", "indie folk", "acoustic", "singer-songwriter"],
  "metal": ["metal", "heavy metal", "death metal", "black metal"],
  "classical": ["classical", "orchestral", "chamber music"],
  "reggae": ["reggae", "dancehall", "ska", "rocksteady"],
  "latin": ["latin", "reggaeton", "salsa", "bachata"],
  "brazilian": ["brazilian", "bossa nova", "samba", "mpb"],
  "blues": ["blues", "chicago blues", "delta blues"],
  "punk": ["punk", "pop punk", "hardcore punk"],
  "chill": ["chill", "chillout", "lofi", "ambient"],
  "ambient": ["ambient", "drone", "new age", "atmospheric"],
  "experimental": ["experimental", "avant-garde", "noise"]
};

/**
 * Calculate genre relevance score with enhanced electronic music matching
 */
function calculateGenreRelevance(playlistGenres: string[], campaignGenres: string[]): number {
  if (playlistGenres.length === 0 || campaignGenres.length === 0) return 0;
  
  let maxRelevance = 0;
  
  // Check each campaign genre against playlist genres
  for (const campaignGenre of campaignGenres) {
    const campaignGenreLower = campaignGenre.toLowerCase();
    
    // Direct match gets highest score
    if (playlistGenres.some(pg => pg.toLowerCase() === campaignGenreLower)) {
      maxRelevance = Math.max(maxRelevance, 1.0);
      continue;
    }
    
    // Check related genres
    const relatedGenres = GENRE_RELATIONS[campaignGenreLower] || [];
    const hasStrongRelated = playlistGenres.some(pg => 
      relatedGenres.includes(pg.toLowerCase())
    );
    
    if (hasStrongRelated) {
      maxRelevance = Math.max(maxRelevance, 0.8);
      continue;
    }
    
    // Check reverse relationship (playlist genre relates to campaign genre)
    for (const playlistGenre of playlistGenres) {
      const playlistGenreLower = playlistGenre.toLowerCase();
      const playlistRelated = GENRE_RELATIONS[playlistGenreLower] || [];
      if (playlistRelated.includes(campaignGenreLower)) {
        maxRelevance = Math.max(maxRelevance, 0.7);
        break;
      }
    }
    
    // Fuzzy matching for partial strings
    for (const playlistGenre of playlistGenres) {
      const pg = playlistGenre.toLowerCase();
      if (pg.includes(campaignGenreLower) || campaignGenreLower.includes(pg)) {
        maxRelevance = Math.max(maxRelevance, 0.5);
      }
    }
  }
  
  return maxRelevance || 0.1; // Minimal relevance for no match
}

/**
 * Estimate playlist capacity when daily stream data is missing
 */
function estimatePlaylistCapacity(
  playlist: Playlist, 
  vendor: Vendor, 
  durationDays: number,
  campaignBudget?: number
): { capacity: number; estimated: boolean } {
  // If we have real data, use it
  if (playlist.avg_daily_streams > 0) {
    return {
      capacity: playlist.avg_daily_streams * durationDays,
      estimated: false
    };
  }
  
  // Cost-based estimation (primary fallback)
  if (vendor.cost_per_1k_streams && vendor.cost_per_1k_streams > 0 && campaignBudget) {
    const budgetPerVendor = campaignBudget * 0.2; // Assume 20% of budget max per vendor
    const estimatedStreams = Math.min(
      (budgetPerVendor * 1000) / vendor.cost_per_1k_streams,
      vendor.max_daily_streams * durationDays * 0.3 // 30% of vendor capacity max
    );
    return {
      capacity: Math.floor(estimatedStreams),
      estimated: true
    };
  }
  
  // Follower-based estimation (secondary fallback)
  if (playlist.follower_count && playlist.follower_count > 0) {
    const followerBasedCapacity = Math.floor(playlist.follower_count * 0.02 * durationDays); // 2% of followers
    return {
      capacity: Math.min(followerBasedCapacity, vendor.max_daily_streams * durationDays * 0.25),
      estimated: true
    };
  }
  
  // Vendor distribution fallback (tertiary)
  if (vendor.max_daily_streams > 0) {
    return {
      capacity: Math.floor(vendor.max_daily_streams * 0.25 * durationDays), // 25% of vendor capacity
      estimated: true
    };
  }
  
  // Conservative default (final fallback)
  return {
    capacity: 5000, // Your suggested baseline
    estimated: true
  };
}

/**
 * Normalize stream count to 0-1 scale
 */
function normalizeStreamScore(streams: number, maxStreams: number): number {
  if (maxStreams === 0) return 0;
  return Math.min(streams / maxStreams, 1.0);
}

/**
 * Calculate overall relevance score with intelligent weighting
 */
function calculateRelevanceScore(
  playlist: Playlist,
  campaignGenres: string[],
  maxStreams: number,
  vendor: Vendor,
  hasStreamData: boolean
): number {
  const genreMatch = calculateGenreRelevance(playlist.genres, campaignGenres);
  const streamScore = normalizeStreamScore(playlist.avg_daily_streams, maxStreams);
  
  // Adjust weighting based on available data
  if (!hasStreamData || maxStreams === 0) {
    // When stream data is missing or unreliable, prioritize genre matching
    let score = genreMatch * 0.8;
    
    // Add follower count factor (20%)
    if (playlist.follower_count && playlist.follower_count > 0) {
      const followerScore = Math.min(playlist.follower_count / 100000, 1.0); // Normalize to 100k followers
      score += followerScore * 0.15;
    }
    
    // Add cost efficiency factor (5%)
    if (vendor.cost_per_1k_streams && vendor.cost_per_1k_streams > 0) {
      const costScore = Math.max(0, (5 - vendor.cost_per_1k_streams) / 5); // Lower cost = higher score
      score += costScore * 0.05;
    }
    
    return Math.min(score, 1.0);
  } else {
    // When stream data is available, balance genre and performance
    return (genreMatch * 0.6) + (streamScore * 0.4);
  }
}

/**
 * Enhanced allocation algorithm with intelligent capacity estimation
 */
export function allocateStreams(input: AllocationInput & { 
  vendors?: Vendor[], 
  campaignBudget?: number,
  campaignGenres?: string[] 
}): {
  allocations: AllocationResult[];
  unfilled: number;
  genreMatches: GenreMatch[];
} {
  const { 
    playlists, 
    goal, 
    vendorCaps, 
    subGenre, 
    durationDays, 
    vendors = [], 
    campaignBudget,
    campaignGenres
  } = input;
  
  // Create vendor lookup map
  const vendorMap = new Map(vendors.map(v => [v.id, v]));
  
  // Filter out playlists from inactive vendors
  const activePlaylists = playlists.filter(playlist => {
    const vendor = vendorMap.get(playlist.vendor_id);
    return vendor && vendor.is_active !== false; // Include vendor if is_active is undefined (backward compatibility) or true
  });

  if (activePlaylists.length === 0 || goal <= 0) {
    return { allocations: [], unfilled: goal, genreMatches: [] };
  }
  
  // Prepare campaign genres (handle both single genre and multiple genres)
  const genresForMatching = campaignGenres?.length ? campaignGenres : [subGenre];
  
  // Calculate max streams for normalization (only from playlists with real data)
  const streamsWithData = activePlaylists
    .map(p => p.avg_daily_streams)
    .filter(streams => streams > 0);
  const maxStreams = streamsWithData.length > 0 ? Math.max(...streamsWithData) : 0;
  const hasReliableStreamData = maxStreams > 0;
  
  // Score and sort playlists by relevance with capacity estimation
  const genreMatches: GenreMatch[] = activePlaylists.map(playlist => {
    const vendor = vendorMap.get(playlist.vendor_id);
    if (!vendor) return null;
    
    const genreMatch = calculateGenreRelevance(playlist.genres, genresForMatching);
    const streamScore = normalizeStreamScore(playlist.avg_daily_streams, maxStreams);
    const relevanceScore = calculateRelevanceScore(
      playlist, 
      genresForMatching, 
      maxStreams, 
      vendor,
      hasReliableStreamData
    );
    
    // Estimate capacity for playlists without stream data
    const capacityInfo = estimatePlaylistCapacity(playlist, vendor, durationDays, campaignBudget);
    
    return {
      playlist,
      relevanceScore,
      genreMatch,
      streamScore,
      capacityEstimated: capacityInfo.estimated,
      estimatedCapacity: capacityInfo.capacity
    };
  })
  .filter(Boolean)
  .sort((a, b) => {
    // Sort by relevance score first, then by capacity if scores are similar
    if (Math.abs(a.relevanceScore - b.relevanceScore) < 0.1) {
      const aCapacity = a.capacityEstimated ? a.estimatedCapacity : a.playlist.avg_daily_streams * durationDays;
      const bCapacity = b.capacityEstimated ? b.estimatedCapacity : b.playlist.avg_daily_streams * durationDays;
      return bCapacity - aCapacity;
    }
    return b.relevanceScore - a.relevanceScore;
  });
  
  // Initialize tracking variables
  let remainingGoal = goal;
  const allocations: AllocationResult[] = [];
  const caps = { ...vendorCaps };
  
  // Allocate streams to playlists in order of relevance with intelligent capacity
  const vendorUsage: Record<string, number> = {};
  
  for (const match of genreMatches) {
    if (remainingGoal <= 0) break;
    
    const playlist = match.playlist;
    const vendor = vendorMap.get(playlist.vendor_id);
    const vendorCap = caps[playlist.vendor_id] || 0;
    
    if (!vendor || vendorCap <= 0) continue;
    
    // Use estimated or real capacity
    const playlistCapacity = match.capacityEstimated 
      ? match.estimatedCapacity 
      : playlist.avg_daily_streams * durationDays;
    
    // Apply vendor distribution logic - limit per vendor to encourage diversity
    const currentVendorUsage = vendorUsage[playlist.vendor_id] || 0;
    const maxVendorUsage = Math.floor(goal * 0.4); // Max 40% of campaign per vendor
    const availableVendorCapacity = Math.min(vendorCap, maxVendorUsage - currentVendorUsage);
    
    const maxAllocation = Math.min(
      remainingGoal,
      availableVendorCapacity,
      playlistCapacity,
      Math.floor(goal * 0.15) // Max 15% of campaign per playlist
    );
    
    if (maxAllocation > 0) {
      allocations.push({
        playlist_id: playlist.id,
        allocation: maxAllocation,
        vendor_id: playlist.vendor_id
      });
      
      remainingGoal -= maxAllocation;
      caps[playlist.vendor_id] = vendorCap - maxAllocation;
      vendorUsage[playlist.vendor_id] = currentVendorUsage + maxAllocation;
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