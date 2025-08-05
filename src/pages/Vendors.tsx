import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  Music,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Info
} from "lucide-react";
import Papa from "papaparse";
import { Vendor, Playlist } from "@/types";
import { UNIFIED_GENRES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import AddVendorModal from "@/components/AddVendorModal";
import AddPlaylistModal from "@/components/AddPlaylistModal";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const vendorFileInputRef = useRef<HTMLInputElement>(null);
  const playlistFileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch playlists for selected vendor
  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['vendor-playlists', selectedVendor],
    queryFn: async (): Promise<Playlist[]> => {
      if (!selectedVendor) return [];
      
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('vendor_id', selectedVendor)
        .order('avg_daily_streams', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedVendor
  });

  // Calculate vendor max daily streams
  const calculateVendorMaxStreams = (vendorId: string) => {
    if (!playlists || selectedVendor !== vendorId) return 0;
    return playlists.reduce((sum, p) => sum + (p.avg_daily_streams || 0), 0);
  };

  // Filter vendors and playlists
  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPlaylists = playlists?.filter(playlist => {
    const matchesSearch = playlist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenres = selectedGenres.length === 0 || 
      selectedGenres.some(genre => playlist.genres?.includes(genre));
    return matchesSearch && matchesGenres;
  }) || [];

  const selectedVendorData = vendors?.find(v => v.id === selectedVendor);

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", vendorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  // CSV Import functionality
  const handleVendorImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          let importCount = 0;
          for (const row of results.data as any[]) {
            if (row.vendor_name?.trim()) {
              const { error } = await supabase
                .from("vendors")
                .insert({
                  name: row.vendor_name.trim(),
                  cost_per_1k_streams: parseFloat(row.cost_per_1k_streams) || 0
                });
              
              if (!error) importCount++;
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ["vendors"] });
          toast({
            title: "Success",
            description: `Imported ${importCount} vendors successfully`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to import vendors",
            variant: "destructive",
          });
        }
      },
    });
    
    // Reset file input
    event.target.value = '';
  };

  const handlePlaylistImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          let importCount = 0;
          for (const row of results.data as any[]) {
            if (row.vendor_name?.trim() && row.playlist_name?.trim()) {
              // Find or create vendor
              let { data: vendor } = await supabase
                .from("vendors")
                .select("id")
                .eq("name", row.vendor_name.trim())
                .single();

              if (!vendor) {
                const { data: newVendor, error: vendorError } = await supabase
                  .from("vendors")
                  .insert({ name: row.vendor_name.trim() })
                  .select()
                  .single();
                
                if (vendorError) continue;
                vendor = newVendor;
              }

              // Create playlist
              const { error } = await supabase
                .from("playlists")
                .insert({
                  vendor_id: vendor.id,
                  name: row.playlist_name.trim(),
                  url: row.playlist_url?.trim() || "",
                  genres: row.genres ? row.genres.split(',').map((g: string) => g.trim()) : [],
                  avg_daily_streams: parseInt(row.avg_daily_streams) || 0,
                  follower_count: parseInt(row.follower_count) || 0
                });
              
              if (!error) importCount++;
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ["vendors"] });
          queryClient.invalidateQueries({ queryKey: ["vendor-playlists"] });
          toast({
            title: "Success",
            description: `Imported ${importCount} playlists successfully`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to import playlists",
            variant: "destructive",
          });
        }
      },
    });
    
    // Reset file input
    event.target.value = '';
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setShowAddPlaylistModal(true);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["vendor-playlists"] });
      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  const toggleGenreFilter = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const exportVendorsCSV = () => {
    if (!vendors || vendors.length === 0) return;
    
    const csvData = vendors.map(vendor => ({
      vendor_name: vendor.name,
      cost_per_1k_streams: vendor.cost_per_1k_streams || 0,
      created_at: vendor.created_at
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedVendor && selectedVendorData) {
    return (
      <div className="p-8 space-y-6">
        {/* Vendor Detail Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedVendor(null)}
              className="px-3"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                {selectedVendorData.name}
              </h1>
              <p className="text-muted-foreground">
                {playlists?.length || 0} playlists • Max {calculateVendorMaxStreams(selectedVendor).toLocaleString()} daily streams
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => {
                setEditingPlaylist(null);
                setShowAddPlaylistModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Playlist
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => playlistFileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                    <Info className="w-3 h-3 ml-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-xs">
                    <p className="font-semibold mb-1">Playlist CSV Format:</p>
                    <pre className="text-xs">vendor_name,playlist_name,playlist_url,genres,avg_daily_streams{'\n'}"Electronic Vibes","Future Bass Central","https://...","electronic,edm",22000</pre>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input
              ref={playlistFileInputRef}
              type="file"
              accept=".csv"
              onChange={handlePlaylistImport}
              className="hidden"
            />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Genre
                {selectedGenres.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedGenres.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
              <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {UNIFIED_GENRES.map(genre => (
                <DropdownMenuCheckboxItem
                  key={genre}
                  checked={selectedGenres.includes(genre)}
                  onCheckedChange={() => toggleGenreFilter(genre)}
                >
                  {genre}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Playlists Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Playlists</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playlistsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Playlist Name</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead>Daily Streams</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlaylists.map((playlist) => (
                    <TableRow key={playlist.id} className="hover:bg-accent/20">
                      <TableCell className="font-medium">
                        {playlist.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {playlist.genres.slice(0, 3).map((genre) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
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
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-secondary" />
                          <span>{playlist.avg_daily_streams.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{playlist.follower_count?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a href={playlist.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPlaylist(playlist)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeletePlaylist(playlist.id)}
                          >
                            <Trash2 className="w-3 h-3" />
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
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Vendors & Playlists
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your playlist vendor network and performance data
          </p>
        </div>
        <div className="flex space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  onClick={() => vendorFileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                  <Info className="w-3 h-3 ml-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-semibold mb-1">Vendor CSV Format:</p>
                  <pre className="text-xs">vendor_name,cost_per_1k_streams{'\n'}"Electronic Vibes",0.05{'\n'}"Hip-Hop Central",0.04</pre>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            ref={vendorFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleVendorImport}
            className="hidden"
          />
          
          <Button variant="outline" onClick={exportVendorsCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            className="bg-gradient-primary hover:opacity-80"
            onClick={() => setShowAddVendorModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendorsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card/30">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded animate-pulse" />
                  <div className="h-4 bg-muted/30 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredVendors.map((vendor) => (
            <Card 
              key={vendor.id} 
              className="bg-card/50 border-border/50 hover:bg-card/70 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setSelectedVendor(vendor.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{vendor.name}</span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit vendor functionality can be added here
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${vendor.name}?`)) {
                          deleteVendorMutation.mutate(vendor.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Daily Streams</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="font-medium">
                      {calculateVendorMaxStreams(vendor.id).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost per 1k</span>
                  <span className="font-medium">${vendor.cost_per_1k_streams || '0.00'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(vendor.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:border-primary/40 group-hover:text-primary transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Playlists
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredVendors.length === 0 && !vendorsLoading && (
        <Card className="bg-card/30">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first vendor"}
            </p>
            <Button 
              className="bg-gradient-primary hover:opacity-80"
              onClick={() => setShowAddVendorModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Vendor
            </Button>
          </CardContent>
        </Card>
      )}
      
      <AddVendorModal open={showAddVendorModal} onOpenChange={setShowAddVendorModal} />
      <AddPlaylistModal 
        open={showAddPlaylistModal} 
        onOpenChange={(open) => {
          setShowAddPlaylistModal(open);
          if (!open) setEditingPlaylist(null);
        }}
        vendorId={selectedVendor || ""}
      />
    </div>
  );
}