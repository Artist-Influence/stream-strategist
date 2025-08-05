import { supabase } from "@/integrations/supabase/client";

export async function insertSampleData() {
  try {
    // Check if data already exists
    const { data: existingVendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1);

    if (existingVendors && existingVendors.length > 0) {
      console.log('Sample data already exists');
      return;
    }

    // Insert sample vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .insert([
        {
          name: "Spotify Curators Co.",
          max_daily_streams: 50000
        },
        {
          name: "Indie Music Network",
          max_daily_streams: 75000
        },
        {
          name: "Electronic Vibes",
          max_daily_streams: 30000
        },
        {
          name: "Hip-Hop Central",
          max_daily_streams: 60000
        }
      ])
      .select();

    if (vendorError) throw vendorError;

    // Insert sample playlists
    const playlists = [
      // Spotify Curators Co. playlists
      {
        vendor_id: vendors[0].id,
        name: "Indie Rock Rising",
        url: "https://open.spotify.com/playlist/indie-rock-rising",
        genres: ["indie", "rock", "alternative"],
        avg_daily_streams: 12000
      },
      {
        vendor_id: vendors[0].id,
        name: "Chill Study Vibes",
        url: "https://open.spotify.com/playlist/chill-study-vibes",
        genres: ["chill", "lo-fi", "study"],
        avg_daily_streams: 18000
      },
      // Indie Music Network playlists
      {
        vendor_id: vendors[1].id,
        name: "Emerging Artists",
        url: "https://open.spotify.com/playlist/emerging-artists",
        genres: ["indie", "singer-songwriter", "folk"],
        avg_daily_streams: 25000
      },
      {
        vendor_id: vendors[1].id,
        name: "Bedroom Pop Paradise",
        url: "https://open.spotify.com/playlist/bedroom-pop-paradise",
        genres: ["bedroom-pop", "indie", "dreamy"],
        avg_daily_streams: 20000
      },
      {
        vendor_id: vendors[1].id,
        name: "Acoustic Coffee Shop",
        url: "https://open.spotify.com/playlist/acoustic-coffee-shop",
        genres: ["acoustic", "folk", "coffee-shop"],
        avg_daily_streams: 15000
      },
      // Electronic Vibes playlists
      {
        vendor_id: vendors[2].id,
        name: "Future Bass Central",
        url: "https://open.spotify.com/playlist/future-bass-central",
        genres: ["future-bass", "electronic", "edm"],
        avg_daily_streams: 22000
      },
      {
        vendor_id: vendors[2].id,
        name: "Synthwave Nights",
        url: "https://open.spotify.com/playlist/synthwave-nights",
        genres: ["synthwave", "retro", "electronic"],
        avg_daily_streams: 8000
      },
      // Hip-Hop Central playlists
      {
        vendor_id: vendors[3].id,
        name: "Underground Hip-Hop",
        url: "https://open.spotify.com/playlist/underground-hip-hop",
        genres: ["hip-hop", "underground", "rap"],
        avg_daily_streams: 30000
      },
      {
        vendor_id: vendors[3].id,
        name: "Trap & Bass",
        url: "https://open.spotify.com/playlist/trap-bass",
        genres: ["trap", "bass", "hip-hop"],
        avg_daily_streams: 28000
      }
    ];

    const { error: playlistError } = await supabase
      .from('playlists')
      .insert(playlists);

    if (playlistError) throw playlistError;

    // Insert sample campaigns
    const { error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          name: "New Artist Launch - Electronic Single",
          brand_name: "Neon Dreams Records",
          client: "Neon Dreams Records",
          track_url: "https://open.spotify.com/track/example1",
          stream_goal: 100000,
          remaining_streams: 85000,
          budget: 2500,
          sub_genre: "electronic",
          start_date: "2024-01-15",
          duration_days: 90,
          status: "active",
          music_genres: ["electronic"],
          content_types: ["single"],
          territory_preferences: ["US", "UK"],
          post_types: ["playlist"]
        }
      ]);

    if (campaignError) throw campaignError;

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}