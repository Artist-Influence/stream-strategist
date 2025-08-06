import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter,
  ExternalLink,
  Edit,
  Download,
  Trash
} from "lucide-react";
import Papa from "papaparse";
import { UNIFIED_GENRES } from "@/lib/constants";

interface PlaylistWithVendor {
  id: string;
  name: string;
  url: string;
  genres: string[];
  avg_daily_streams: number;
  follower_count?: number;
  vendor: {
    id: string;
    name: string;
    cost_per_1k_streams: number;
  };
}

export default function BrowsePlaylists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  // Fetch all playlists with vendor data
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['all-playlists'],
    queryFn: async (): Promise<PlaylistWithVendor[]> => {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          vendor:vendors(id, name, cost_per_1k_streams)
        `)
        .order('avg_daily_streams', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch vendors for filter
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filter playlists
  const filteredPlaylists = playlists?.filter(playlist => {
    const matchesSearch = playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === "all" || playlist.genres.includes(genreFilter);
    const matchesVendor = vendorFilter === "all" || playlist.vendor.id === vendorFilter;
    return matchesSearch && matchesGenre && matchesVendor;
  }) || [];

  const editPlaylist = (playlist: PlaylistWithVendor) => {
    // This would open edit modal - for now just log
    console.log("Edit playlist:", playlist);
  };

  const handleExportCSV = () => {
    if (!playlists || playlists.length === 0) return;
    
    const exportData = playlists.map(playlist => ({
      vendor_name: playlist.vendor?.name || '',
      cost_per_1k_streams: playlist.vendor?.cost_per_1k_streams || 0,
      playlist_url: playlist.url || ''
    }));
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendors_playlists_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);
      
      if (error) throw error;
      // Refetch playlists
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="text-center pt-8 pb-4">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            BROWSE PLAYLISTS
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore all playlists across vendors with advanced filtering
          </p>
        </section>

        <div className="container mx-auto px-6 space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Vendors & Playlists</h2>
              <p className="text-muted-foreground">Manage vendors and their playlists</p>
            </div>
            <Button onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Tabs defaultValue="vendors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendors">By Vendor</TabsTrigger>
              <TabsTrigger value="all">All Playlists</TabsTrigger>
            </TabsList>

            <TabsContent value="vendors" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    Switch to the <strong>Vendors</strong> page to browse playlists organized by vendor.
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={() => window.location.href = '/vendors'}>
                      Go to Vendors Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search playlists or vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={genreFilter} onValueChange={setGenreFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genres</SelectItem>
                        {UNIFIED_GENRES.map(genre => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={vendorFilter} onValueChange={setVendorFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        {vendors?.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Playlists Table */}
              <Card className="metric-card">
                <CardHeader>
                  <CardTitle>All Playlists</CardTitle>
                  <CardDescription>
                    {filteredPlaylists.length} playlists found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : filteredPlaylists.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No playlists found matching your criteria
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setGenreFilter("all");
                          setVendorFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Playlist</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Genres</TableHead>
                          <TableHead>Followers</TableHead>
                          <TableHead>Avg Daily Streams</TableHead>
                          <TableHead>Cost/1k</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlaylists.map((playlist) => (
                          <TableRow key={playlist.id} className="hover:bg-accent/10">
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div>
                                  <p className="font-medium">{playlist.name}</p>
                                  <a 
                                    href={playlist.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    View on Spotify <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{playlist.vendor.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${playlist.vendor.cost_per_1k_streams}/1k streams
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {playlist.genres.slice(0, 3).map((genre, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                                {playlist.genres.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{playlist.genres.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {playlist.follower_count?.toLocaleString() || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">
                                {playlist.avg_daily_streams?.toLocaleString() || '0'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-accent">
                                ${playlist.vendor.cost_per_1k_streams}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => editPlaylist(playlist)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeletePlaylist(playlist.id)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}