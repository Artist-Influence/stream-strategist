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
      
      return new Response(JSON.stringify({
        name: data.name,
        artists: data.artists,
        album: data.album
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
  const GENRE_MAPPINGS: Record<string, string[]> = {
    'rock': ['indie rock', 'alt rock', 'alternative', 'indie', 'garage rock'],
    'hip-hop': ['trap', 'rap', 'underground hip hop', 'boom bap', 'hip hop'],
    'electronic': ['house', 'techno', 'edm', 'dance', 'electronica'],
    'phonk': ['drift phonk', 'gym phonk', 'phonk house'],
    'workout': ['gym', 'motivational', 'pump up', 'training'],
    'pop': ['pop', 'electropop', 'indie pop'],
    'r&b': ['r&b', 'neo soul', 'contemporary r&b'],
    'jazz': ['jazz', 'smooth jazz', 'jazz fusion'],
    'classical': ['classical', 'orchestral', 'chamber music'],
    'reggae': ['reggae', 'reggaeton', 'dancehall'],
    'country': ['country', 'folk', 'americana'],
    'metal': ['metal', 'heavy metal', 'death metal', 'black metal'],
    'punk': ['punk', 'hardcore', 'post-punk'],
    'blues': ['blues', 'electric blues', 'delta blues'],
    'funk': ['funk', 'soul', 'disco'],
    'dubstep': ['dubstep', 'bass', 'riddim'],
    'lo-fi': ['lo-fi', 'chillhop', 'ambient'],
    'synthwave': ['synthwave', 'retrowave', 'vaporwave']
  };
  
  const mainGenres = new Set<string>();
  
  spotifyGenres.forEach(genre => {
    const normalized = genre.toLowerCase();
    
    // Find which main genre this maps to
    for (const [main, subs] of Object.entries(GENRE_MAPPINGS)) {
      if (subs.some(sub => normalized.includes(sub)) || normalized.includes(main)) {
        mainGenres.add(main);
        break;
      }
    }
  });
  
  // Return top 4 main genres
  return Array.from(mainGenres).slice(0, 4);
}