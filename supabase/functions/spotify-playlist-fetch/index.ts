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

    // Get Spotify access token from secrets
    const spotifyToken = Deno.env.get('SPOTIFY_ACCESS_TOKEN');
    if (!spotifyToken) {
      throw new Error('Spotify access token not found');
    }

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
        // Get audio features for genre analysis
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json();
          // Simple genre mapping based on audio features
          genres = mapAudioFeaturesToGenres(featuresData.audio_features);
        }
      }
    }

    const result = {
      name: playlistData.name,
      followers: playlistData.followers,
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

// Simple mapping function to convert audio features to genres
function mapAudioFeaturesToGenres(audioFeatures: any[]): string[] {
  const genreMapping = new Map<string, number>();
  
  for (const features of audioFeatures) {
    if (!features) continue;
    
    // Energy + Valence = Happy/Upbeat genres
    if (features.energy > 0.7 && features.valence > 0.6) {
      genreMapping.set('pop', (genreMapping.get('pop') || 0) + 1);
      genreMapping.set('edm', (genreMapping.get('edm') || 0) + 1);
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
      genreMapping.set('indie', (genreMapping.get('indie') || 0) + 1);
    }
    
    // High instrumentalness = Ambient/Classical
    if (features.instrumentalness > 0.5) {
      genreMapping.set('ambient', (genreMapping.get('ambient') || 0) + 1);
      if (features.acousticness > 0.7) {
        genreMapping.set('classical', (genreMapping.get('classical') || 0) + 1);
      }
    }
  }
  
  // Return top 3 genres
  return Array.from(genreMapping.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}