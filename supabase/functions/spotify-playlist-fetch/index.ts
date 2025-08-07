import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playlistId } = await req.json();
    
    if (!playlistId) {
      throw new Error('Playlist ID is required');
    }

    // Get Spotify credentials from secrets
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not found');
    }

    // Get fresh access token using client credentials flow
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Spotify token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const spotifyToken = tokenData.access_token;

    console.log(`Fetching playlist data for ID: ${playlistId}`);

    // Fetch playlist data from Spotify API
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!playlistResponse.ok) {
      throw new Error(`Spotify API error: ${playlistResponse.status}`);
    }

    const playlistData = await playlistResponse.json();

    // Fetch tracks to analyze genres
    const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    let genres = [];
    if (tracksResponse.ok) {
      const tracksData = await tracksResponse.json();
      const trackIds = tracksData.items
        .map(item => item.track?.id)
        .filter(id => id)
        .slice(0, 20); // Limit to 20 tracks for analysis

      if (trackIds.length > 0) {
        // Get artist IDs for genre analysis
        const artistIds = tracksData.items
          .map(item => item.track?.artists?.[0]?.id)
          .filter(id => id)
          .slice(0, 20);

        if (artistIds.length > 0) {
          // Get artist genres (more accurate than audio features)
          const artistsResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (artistsResponse.ok) {
            const artistsData = await artistsResponse.json();
            const allGenres = artistsData.artists
              .flatMap(artist => artist.genres || [])
              .filter(genre => genre);
            
            genres = groupSimilarGenres(allGenres);
          }
        }

        // Fallback to audio features if no artist genres found
        if (genres.length === 0) {
          const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            genres = mapAudioFeaturesToGenres(featuresData.audio_features);
          }
        }
      }
    }

    const result = {
      name: playlistData.name,
      followers: playlistData.followers?.total || 0,
      genres: genres.length > 0 ? genres : ['pop'], // Default to pop if no genres detected
      description: playlistData.description,
    };

    console.log('Playlist data fetched successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in spotify-playlist-fetch function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch playlist data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Group similar genres into main categories
function groupSimilarGenres(spotifyGenres: string[]): string[] {
  const genreMapping = new Map<string, number>();
  
  const genreCategories = {
    'phonk': ['phonk', 'drift phonk', 'gym phonk', 'phonk house', 'brazilian phonk', 'cowbell phonk'],
    'tech house': ['tech house', 'techno house'],
    'house': ['house', 'deep house', 'progressive house', 'future house', 'bass house', 'tribal house', 'electro house', 'big room house'],
    'progressive house': ['progressive house', 'prog house'],
    'afro house': ['afro house', 'afro-house', 'afrobeats house'],
    'afrobeats': ['afrobeats', 'afro beat', 'afro-beat', 'afrobeat'],
    'techno': ['techno', 'hard techno', 'minimal techno', 'detroit techno'],
    'hardstyle': ['hardstyle', 'hard style', 'rawstyle', 'euphoric hardstyle'],
    'dubstep': ['dubstep', 'brostep', 'melodic dubstep', 'future dubstep'],
    'dance': ['dance', 'club', 'disco', 'eurodance', 'freestyle', 'edm'],
    'electronic': ['electronic', 'edm', 'electro', 'bass', 'future bass', 'ambient', 'trance'],
    'pop': ['pop', 'dance pop', 'electropop', 'indie pop', 'synthpop', 'art pop', 'dream pop', 'k-pop', 'j-pop', 'europop'],
    'indie': ['indie', 'indie rock', 'indie pop', 'indie folk', 'shoegaze', 'new wave'],
    'alternative': ['alternative', 'alt rock', 'grunge', 'britpop', 'madchester', 'alternative rock'],
    'rock': ['rock', 'classic rock', 'hard rock', 'punk rock', 'garage rock', 'psychedelic rock', 'prog rock', 'art rock', 'glam rock'],
    'hip-hop': ['hip hop', 'rap', 'trap', 'drill', 'boom bap', 'conscious hip hop', 'gangsta rap', 'old school hip hop', 'mumble rap'],
    'r&b': ['r&b', 'soul', 'neo soul', 'contemporary r&b', 'funk', 'motown', 'quiet storm'],
    'country': ['country', 'country rock', 'alt-country', 'americana', 'bluegrass', 'folk country', 'modern country'],
    'jazz': ['jazz', 'smooth jazz', 'bebop', 'swing', 'fusion', 'contemporary jazz', 'acid jazz'],
    'folk': ['folk', 'folk rock', 'singer-songwriter', 'acoustic', 'chamber folk'],
    'metal': ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'metalcore', 'nu metal', 'progressive metal'],
    'classical': ['classical', 'orchestral', 'chamber music', 'opera', 'baroque', 'romantic'],
    'reggae': ['reggae', 'dub', 'ska', 'dancehall', 'reggaeton'],
    'latin': ['latin', 'salsa', 'bachata', 'merengue', 'bossa nova', 'tango', 'cumbia', 'mariachi'],
    'blues': ['blues', 'electric blues', 'delta blues', 'chicago blues', 'country blues'],
    'brazilian': ['brazilian', 'bossa nova', 'samba', 'mpb', 'forró', 'axé', 'pagode', 'sertanejo'],
    'punk': ['punk', 'hardcore', 'post-punk', 'pop punk', 'ska punk'],
    'chill': ['chill', 'chillout', 'lounge', 'downtempo', 'trip hop', 'lo-fi']
  };

  // Expanded list of words to skip - including single adjectives and meaningless terms
  const skipWords = [
    'big', 'small', 'new', 'old', 'modern', 'classic', 'deep', 'dark', 'light', 'heavy', 'soft', 'hard', 'fast', 'slow',
    'good', 'bad', 'best', 'top', 'hot', 'cool', 'fresh', 'raw', 'pure', 'real', 'true', 'main', 'core', 'base',
    'super', 'mega', 'ultra', 'hyper', 'max', 'mini', 'micro', 'macro', 'pro', 'amateur', 'professional',
    'early', 'late', 'mid', 'post', 'pre', 'neo', 'retro', 'vintage', 'contemporary', 'current', 'recent',
    'underground', 'mainstream', 'commercial', 'experimental', 'traditional', 'fusion', 'crossover',
    'vocal', 'instrumental', 'acoustic', 'electric', 'digital', 'analog', 'synthetic', 'organic',
    'male', 'female', 'mixed', 'solo', 'group', 'band', 'artist', 'singer', 'rapper', 'dj', 'producer',
    'gabber' // Specifically filtering out gabber as it's too niche
  ];

  for (const genre of spotifyGenres) {
    const lowerGenre = genre.toLowerCase().trim();
    let categorized = false;
    
    // Skip meaningless terms, single words that are adjectives, and genres that are too short
    if (skipWords.includes(lowerGenre) || lowerGenre.length < 3) {
      continue;
    }
    
    // Check against our curated genre categories with priority matching
    for (const [category, keywords] of Object.entries(genreCategories)) {
      // Exact match gets priority
      if (keywords.includes(lowerGenre)) {
        genreMapping.set(category, (genreMapping.get(category) || 0) + 3);
        categorized = true;
        break;
      }
      // Partial match gets lower priority
      if (keywords.some(keyword => lowerGenre.includes(keyword) || keyword.includes(lowerGenre))) {
        genreMapping.set(category, (genreMapping.get(category) || 0) + 1);
        categorized = true;
        break;
      }
    }
    
    // Only allow well-known, legitimate genres that weren't categorized
    if (!categorized) {
      const allowedStandaloneGenres = [
        'trance', 'ambient', 'drum and bass', 'dnb', 'garage', 'grime', 'dubstep', 'breakbeat',
        'downtempo', 'trip hop', 'world', 'ethnic', 'traditional', 'experimental', 'noise',
        'minimal', 'industrial', 'gothic', 'darkwave', 'synthwave', 'vaporwave',
        'lounge', 'easy listening', 'smooth', 'chill', 'relaxing'
      ];
      
      if (allowedStandaloneGenres.some(allowed => lowerGenre.includes(allowed) || allowed.includes(lowerGenre))) {
        // Clean up the genre name
        let cleanGenre = lowerGenre
          .replace(/[0-9]+/g, '') // Remove numbers
          .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        if (cleanGenre.length > 2 && !skipWords.includes(cleanGenre)) {
          genreMapping.set(cleanGenre, (genreMapping.get(cleanGenre) || 0) + 1);
        }
      }
    }
  }
  
  // Return top 3 genres, weighted by priority
  return Array.from(genreMapping.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}

// Simple mapping function to convert audio features to genres (fallback)
function mapAudioFeaturesToGenres(audioFeatures: any[]): string[] {
  const genreMapping = new Map<string, number>();
  
  for (const features of audioFeatures) {
    if (!features) continue;
    
    // Energy + Valence = Happy/Upbeat genres
    if (features.energy > 0.7 && features.valence > 0.6) {
      genreMapping.set('pop', (genreMapping.get('pop') || 0) + 1);
    }
    
    // High energy + low valence = Rock/Metal
    if (features.energy > 0.8 && features.valence < 0.4) {
      genreMapping.set('rock', (genreMapping.get('rock') || 0) + 1);
    }
    
    // High danceability = Electronic/Hip-hop
    if (features.danceability > 0.7) {
      genreMapping.set('electronic', (genreMapping.get('electronic') || 0) + 1);
      if (features.speechiness > 0.1) {
        genreMapping.set('hip-hop', (genreMapping.get('hip-hop') || 0) + 1);
      }
    }
    
    // Low energy + acoustic = Folk/Indie
    if (features.energy < 0.4 && features.acousticness > 0.5) {
      genreMapping.set('folk', (genreMapping.get('folk') || 0) + 1);
    }
  }
  
  // Return top 3 genres
  return Array.from(genreMapping.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}