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
  // Enhanced genre mapping with more specific sub-genres
  const GENRE_MAPPINGS: Record<string, string[]> = {
    // House music sub-genres (prioritized)
    'Progressive House': ['progressive house', 'prog house'],
    'Afro House': ['afro house', 'afrohouse', 'african house'],
    'Deep House': ['deep house', 'deephouse'],
    'Tech House': ['tech house', 'techhouse'],
    'Future House': ['future house', 'future bass house'],
    'Tribal House': ['tribal house', 'tribal'],
    'Big Room House': ['big room', 'big room house', 'festival house'],
    'Melodic House': ['melodic house', 'melodic techno'],
    
    // Electronic sub-genres
    'Future Bass': ['future bass', 'futurebass'],
    'Bass Music': ['bass music', 'bass', 'dubstep', 'trap music'],
    'Ambient': ['ambient', 'chillout', 'downtempo', 'lo-fi', 'chillhop'],
    'Techno': ['techno', 'minimal techno', 'industrial techno'],
    'Trance': ['trance', 'progressive trance', 'uplifting trance'],
    'Drum & Bass': ['drum and bass', 'dnb', 'jungle'],
    'Synthwave': ['synthwave', 'retrowave', 'vaporwave'],
    
    // Other specific genres
    'phonk': ['drift phonk', 'gym phonk', 'phonk house'],
    'workout': ['gym', 'motivational', 'pump up', 'training'],
    'rock': ['indie rock', 'alt rock', 'alternative rock', 'garage rock'],
    'indie': ['indie', 'indie pop', 'indie folk', 'indie electronic'],
    'hip-hop': ['trap', 'rap', 'underground hip hop', 'boom bap', 'hip hop'],
    'pop': ['pop', 'electropop', 'indie pop', 'dance pop'],
    'r&b': ['r&b', 'neo soul', 'contemporary r&b'],
    'jazz': ['jazz', 'smooth jazz', 'jazz fusion'],
    'classical': ['classical', 'orchestral', 'chamber music'],
    'reggae': ['reggae', 'reggaeton', 'dancehall'],
    'country': ['country', 'folk', 'americana'],
    'metal': ['metal', 'heavy metal', 'death metal', 'black metal'],
    'punk': ['punk', 'hardcore', 'post-punk'],
    'blues': ['blues', 'electric blues', 'delta blues'],
    'funk': ['funk', 'soul', 'disco'],
    
    // Broader fallbacks (lower priority)
    'electronic': ['house', 'edm', 'dance', 'electronica', 'electronic']
  };
  
  const mainGenres = new Set<string>();
  const lowerSpotifyGenres = spotifyGenres.map(g => g.toLowerCase());
  
  console.log('Mapping Spotify genres:', spotifyGenres);
  
  // First pass: Look for specific sub-genres (prioritize specific over generic)
  for (const [mainGenre, subGenres] of Object.entries(GENRE_MAPPINGS)) {
    for (const subGenre of subGenres) {
      if (lowerSpotifyGenres.some(spotifyGenre => 
        spotifyGenre.includes(subGenre) || subGenre.includes(spotifyGenre)
      )) {
        mainGenres.add(mainGenre);
        console.log(`Mapped "${subGenre}" to "${mainGenre}"`);
        break;
      }
    }
  }
  
  // Prioritize specific genres over generic ones
  const result = Array.from(mainGenres);
  const houseGenres = result.filter(g => g.includes('House'));
  const specificGenres = result.filter(g => !['electronic', 'pop', 'rock'].includes(g) && !g.includes('House'));
  const genericGenres = result.filter(g => ['electronic', 'pop', 'rock'].includes(g));
  
  const finalGenres = [...houseGenres, ...specificGenres, ...genericGenres].slice(0, 3);
  console.log('Final mapped genres:', finalGenres);
  
  // If no mapping found, return original genres (up to 2)
  return finalGenres.length > 0 ? finalGenres : spotifyGenres.slice(0, 2);
}