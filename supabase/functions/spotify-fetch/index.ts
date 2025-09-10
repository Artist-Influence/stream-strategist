import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID')!;
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;

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
    const { trackUrl, playlistUrl, trackId, type } = await req.json();
    
    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });
    
    const { access_token } = await tokenResponse.json();
    
    if (!access_token) {
      throw new Error('Failed to get Spotify access token');
    }
    
    // Handle track fetching
    if (trackUrl || (trackId && type === 'track')) {
      const id = trackId || trackUrl.split('/track/')[1]?.split('?')[0];
      const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      const data = await response.json();
      
      // Extract genres from track's artists
      const genres = await extractTrackGenres(data, access_token);
      
      return new Response(JSON.stringify({
        name: data.name,
        artists: data.artists,
        album: data.album,
        genres: mapToMainGenres(genres)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle playlist fetching
    if (playlistUrl) {
      const playlistId = playlistUrl.split('/playlist/')[1]?.split('?')[0];
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      const data = await response.json();
      
      // Extract genres from artists in playlist
      const genres = await extractPlaylistGenres(data, access_token);
      
      return new Response(JSON.stringify({
        name: data.name,
        followers: data.followers?.total || 0,
        genres: mapToMainGenres(genres)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    throw new Error('Invalid request - provide trackUrl or playlistUrl');
    
  } catch (error) {
    console.error('Spotify API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTrackGenres(track: any, accessToken: string): Promise<string[]> {
  try {
    const artistIds = track.artists?.map((artist: any) => artist.id).filter(Boolean) || [];
    
    if (artistIds.length === 0) return [];
    
    // Fetch artist genres
    const response = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const data = await response.json();
    const genres: string[] = [];
    
    data.artists?.forEach((artist: any) => {
      if (artist.genres) {
        genres.push(...artist.genres);
      }
    });
    
    return genres;
  } catch (error) {
    console.error('Error extracting track genres:', error);
    return [];
  }
}

async function extractPlaylistGenres(playlist: any, accessToken: string): Promise<string[]> {
  try {
    const artistIds = new Set<string>();
    
    // Get artist IDs from first 20 tracks
    const tracks = playlist.tracks?.items?.slice(0, 20) || [];
    tracks.forEach((item: any) => {
      item.track?.artists?.forEach((artist: any) => {
        if (artist.id) artistIds.add(artist.id);
      });
    });
    
    if (artistIds.size === 0) return [];
    
    // Fetch artist genres in batches
    const genres: string[] = [];
    const artistIdArray = Array.from(artistIds);
    
    for (let i = 0; i < artistIdArray.length; i += 50) {
      const batch = artistIdArray.slice(i, i + 50);
      const response = await fetch(`https://api.spotify.com/v1/artists?ids=${batch.join(',')}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      data.artists?.forEach((artist: any) => {
        if (artist.genres) {
          genres.push(...artist.genres);
        }
      });
    }
    
    return genres;
  } catch (error) {
    console.error('Error extracting genres:', error);
    return [];
  }
}

function mapToMainGenres(spotifyGenres: string[]): string[] {
  // UNIFIED_GENRES from constants.ts - these are the ONLY valid genres our app accepts
  const VALID_GENRES = [
    'phonk', 'tech house', 'techno', 'minimal', 'house', 'progressive house',
    'bass house', 'big room', 'afro house', 'afrobeats', 'hardstyle', 
    'dubstep', 'trap', 'melodic bass', 'trance', 'dance', 'pop', 'indie', 
    'alternative', 'rock', 'hip-hop', 'r&b', 'country', 'jazz', 'folk', 
    'metal', 'classical', 'reggae', 'latin', 'brazilian', 'blues', 'punk', 
    'chill', 'ambient', 'experimental'
  ];

  // Comprehensive sub-genre to umbrella-genre mappings
  const GENRE_MAPPINGS: Record<string, string[]> = {
    // Hip-hop and rap variations
    'hip-hop': [
      'midwestern rap', 'atlanta trap', 'drill', 'boom bap', 'conscious rap', 
      'gangsta rap', 'underground hip hop', 'southern rap', 'east coast hip hop',
      'west coast hip hop', 'chicago rap', 'detroit rap', 'memphis rap', 'trap music',
      'rap', 'hip hop', 'hip-hop', 'underground rap', 'old school rap', 'new school rap'
    ],
    
    // Dubstep and bass music
    'dubstep': [
      'riddim', 'brostep', 'melodic dubstep', 'future riddim', 'bass music',
      'heavy dubstep', 'melodic bass', 'future bass', 'neurofunk', 'drum and bass',
      'dnb', 'liquid dnb'
    ],
    
    // Techno variations  
    'techno': [
      'melodic techno', 'industrial techno', 'detroit techno', 'berlin techno',
      'acid techno', 'hard techno', 'deep techno', 'progressive techno'
    ],
    
    // Phonk variations
    'phonk': [
      'brazilian phonk', 'drift phonk', 'gym phonk', 'memphis phonk', 
      'aggressive phonk', 'house phonk', 'trap phonk'
    ],
    
    // House music sub-genres
    'house': [
      'deep house', 'future house', 'tribal house', 'vocal house', 'soulful house',
      'chicago house', 'garage house', 'electro house', 'funky house'
    ],
    'tech house': ['tech house', 'techhouse'],
    'progressive house': ['progressive house', 'prog house'],
    'bass house': ['bass house', 'basshouse', 'g house'],
    'big room': ['big room', 'big room house', 'festival house', 'mainstage'],
    'afro house': ['afro house', 'afrohouse', 'african house'],
    
    // Electronic and dance
    'dance': ['edm', 'electronic dance music', 'dance music', 'festival'],
    'trance': ['trance', 'progressive trance', 'uplifting trance', 'psytrance', 'vocal trance'],
    'hardstyle': ['hardstyle', 'hardcore', 'hard dance', 'rawstyle'],
    'trap': ['trap', 'future trap', 'hybrid trap', 'festival trap'],
    'melodic bass': ['melodic bass', 'future bass', 'melodic dubstep', 'chillstep'],
    
    // Minimal and ambient
    'minimal': ['minimal', 'minimal techno', 'microhouse', 'minimal house'],
    'ambient': ['ambient', 'chillout', 'downtempo', 'atmospheric'],
    'chill': ['chill', 'chillwave', 'lo-fi', 'chillhop', 'study music'],
    
    // Traditional genres
    'pop': ['pop', 'electropop', 'dance pop', 'synth pop', 'indie pop', 'pop rock'],
    'rock': ['rock', 'indie rock', 'alt rock', 'alternative rock', 'garage rock', 'punk rock'],
    'alternative': ['alternative', 'alt', 'indie alternative', 'modern rock'],
    'indie': ['indie', 'indie folk', 'indie electronic', 'indie dance'],
    'r&b': ['r&b', 'neo soul', 'contemporary r&b', 'rnb', 'soul'],
    'jazz': ['jazz', 'smooth jazz', 'jazz fusion', 'contemporary jazz', 'nu jazz'],
    'folk': ['folk', 'americana', 'country folk', 'indie folk'],
    'country': ['country', 'country pop', 'country rock', 'nashville'],
    'classical': ['classical', 'orchestral', 'chamber music', 'contemporary classical'],
    'metal': ['metal', 'heavy metal', 'death metal', 'black metal', 'progressive metal'],
    'punk': ['punk', 'hardcore punk', 'post-punk', 'pop punk'],
    'blues': ['blues', 'electric blues', 'delta blues', 'chicago blues'],
    'experimental': ['experimental', 'avant-garde', 'noise', 'industrial'],
    
    // Regional and cultural
    'reggae': ['reggae', 'dancehall', 'dub', 'ska'],
    'latin': ['reggaeton', 'latin pop', 'latin trap', 'cumbia', 'salsa', 'bachata'],
    'brazilian': ['brazilian funk', 'bossa nova', 'samba', 'mpb', 'brazilian bass'],
    'afrobeats': ['afrobeats', 'afropop', 'afro', 'nigerian pop', 'ghanaian pop']
  };
  
  console.log('Raw Spotify genres received:', spotifyGenres);
  
  if (!spotifyGenres || spotifyGenres.length === 0) {
    console.log('No genres provided');
    return [];
  }
  
  const mappedGenres = new Set<string>();
  const lowerSpotifyGenres = spotifyGenres.map(g => g.toLowerCase().trim());
  
  console.log('Normalized Spotify genres:', lowerSpotifyGenres);
  
  // First pass: Exact matches and sub-genre mapping
  for (const [mainGenre, subGenres] of Object.entries(GENRE_MAPPINGS)) {
    for (const subGenre of subGenres) {
      const lowerSubGenre = subGenre.toLowerCase();
      
      // Check for exact matches or partial matches
      const hasMatch = lowerSpotifyGenres.some(spotifyGenre => {
        return spotifyGenre === lowerSubGenre || 
               spotifyGenre.includes(lowerSubGenre) || 
               lowerSubGenre.includes(spotifyGenre);
      });
      
      if (hasMatch) {
        mappedGenres.add(mainGenre);
        console.log(`✓ Mapped Spotify genre containing "${subGenre}" to "${mainGenre}"`);
        break; // Move to next main genre
      }
    }
  }
  
  // Second pass: Fuzzy matching with common sense
  for (const spotifyGenre of lowerSpotifyGenres) {
    if (mappedGenres.size >= 3) break; // Limit to 3 genres
    
    // Check for regional prefixes and remove them for better matching
    let cleanGenre = spotifyGenre;
    const regionalPrefixes = ['brazilian', 'mexican', 'uk', 'chicago', 'detroit', 'atlanta', 'miami', 'new york', 'london', 'berlin'];
    for (const prefix of regionalPrefixes) {
      if (spotifyGenre.startsWith(prefix + ' ')) {
        cleanGenre = spotifyGenre.replace(prefix + ' ', '');
        
        // Map regional variations
        if (prefix === 'brazilian' && cleanGenre.includes('funk')) {
          mappedGenres.add('brazilian');
          console.log(`✓ Mapped regional "${spotifyGenre}" to "brazilian"`);
          continue;
        }
      }
    }
    
    // Check if clean genre matches any valid genre directly
    if (VALID_GENRES.includes(cleanGenre)) {
      mappedGenres.add(cleanGenre);
      console.log(`✓ Direct match: "${spotifyGenre}" → "${cleanGenre}"`);
      continue;
    }
    
    // Fuzzy matching for common variations
    if (cleanGenre.includes('house') && !mappedGenres.has('house')) {
      mappedGenres.add('house');
      console.log(`✓ Fuzzy match: "${spotifyGenre}" → "house"`);
    } else if ((cleanGenre.includes('hip') || cleanGenre.includes('rap')) && !mappedGenres.has('hip-hop')) {
      mappedGenres.add('hip-hop');
      console.log(`✓ Fuzzy match: "${spotifyGenre}" → "hip-hop"`);
    } else if (cleanGenre.includes('electronic') && !mappedGenres.has('dance')) {
      mappedGenres.add('dance');
      console.log(`✓ Fuzzy match: "${spotifyGenre}" → "dance"`);
    }
  }
  
  const result = Array.from(mappedGenres).slice(0, 3);
  console.log('Final mapped genres:', result);
  
  // Fallback: if no mappings found, try to use original genres if they match VALID_GENRES
  if (result.length === 0) {
    const fallbackGenres = lowerSpotifyGenres.filter(genre => VALID_GENRES.includes(genre)).slice(0, 2);
    console.log('Using fallback genres:', fallbackGenres);
    return fallbackGenres;
  }
  
  return result;
}