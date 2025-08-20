import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Target,
  TrendingUp,
  Users,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Vendor, Playlist } from "@/types";
import { allocateStreams, calculateProjections, GenreMatch, validateAllocations } from "@/lib/allocationAlgorithm";

interface AIRecommendationsProps {
  campaignData: {
    name: string;
    client: string;
    client_id?: string;
    track_url: string;
    track_name?: string;
    stream_goal: number;
    budget: number;
    sub_genre: string;
    start_date: string;
    duration_days: number;
  };
  onNext: (allocations: any) => void;
  onBack: () => void;
}

export default function AIRecommendations({ campaignData, onNext, onBack }: AIRecommendationsProps) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [genreMatches, setGenreMatches] = useState<GenreMatch[]>([]);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});

  // Fetch vendors and playlists (only active vendors for AI recommendations)
  const { data: vendors } = useQuery({
    queryKey: ['vendors', 'active'],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['playlists-for-campaign', 'active-vendors'],
    queryFn: async (): Promise<Playlist[]> => {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          vendor:vendors!inner(is_active)
        `)
        .eq('vendor.is_active', true)
        .order('avg_daily_streams', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Run AI allocation when data is ready
  useEffect(() => {
    if (playlists && vendors && !isAllocating) {
      runAllocation();
    }
  }, [playlists, vendors, campaignData]);

  const runAllocation = async () => {
    if (!playlists || !vendors) return;
    
    setIsAllocating(true);
    
    // Create vendor caps map
    const vendorCaps: Record<string, number> = {};
    vendors.forEach(vendor => {
      vendorCaps[vendor.id] = vendor.max_daily_streams * campaignData.duration_days;
    });

    try {
      // Run allocation algorithm with enhanced parameters
      const result = await allocateStreams({
        playlists,
        goal: campaignData.stream_goal,
        vendorCaps,
        subGenre: campaignData.sub_genre,
        durationDays: campaignData.duration_days,
        vendors: vendors,
        campaignBudget: campaignData.budget,
        campaignGenres: [campaignData.sub_genre]
      });

      setAllocations(result.allocations);
      setGenreMatches(result.genreMatches);
      
      // Auto-select top playlists
      const topPlaylists = result.allocations.slice(0, 15).map(a => a.playlist_id);
      setSelectedPlaylists(new Set(topPlaylists));
      
    } catch (error) {
      console.error('Allocation failed:', error);
    } finally {
      setIsAllocating(false);
    }
  };

  const togglePlaylist = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const updateManualAllocation = (playlistId: string, allocation: number) => {
    setManualAllocations(prev => ({
      ...prev,
      [playlistId]: allocation
    }));
  };

  // Create allocations for selected playlists (including manual ones)
  const selectedAllocations = Array.from(selectedPlaylists).map(playlistId => {
    const existingAllocation = allocations.find(a => a.playlist_id === playlistId);
    const playlist = playlists?.find(p => p.id === playlistId);
    const vendor = vendors?.find(v => v.id === playlist?.vendor_id);
    
    if (existingAllocation) {
      return existingAllocation;
    }
    
    // Create manual allocation for selected playlists without automatic allocation
    // Default allocation should be campaign total (daily streams * duration)
    const defaultCampaignTotal = Math.min(1000 * campaignData.duration_days, (playlist?.avg_daily_streams || 100) * campaignData.duration_days);
    return {
      playlist_id: playlistId,
      vendor_id: vendor?.id || '',
      allocation: manualAllocations[playlistId] || defaultCampaignTotal
    };
  }).filter(a => a.vendor_id); // Filter out invalid allocations
  const projections = calculateProjections(selectedAllocations, playlists || []);
  const validation = validateAllocations(
    selectedAllocations, 
    vendors?.reduce((acc, v) => ({ ...acc, [v.id]: v.max_daily_streams * campaignData.duration_days }), {}) || {},
    playlists || [],
    campaignData.duration_days
  );

  const handleContinue = () => {
    const finalAllocations = selectedAllocations.map(allocation => ({
      ...allocation,
      allocation: manualAllocations[allocation.playlist_id] || allocation.allocation
    }));
    
    onNext({
      allocations: finalAllocations,
      projections,
      selectedPlaylists: Array.from(selectedPlaylists)
    });
  };

  if (playlistsLoading || isAllocating) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <Card className="bg-gradient-glow border-primary/20">
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-12 h-12 text-primary animate-spin" />
              <h2 className="text-xl font-semibold">AI Analyzing Playlists...</h2>
              <p className="text-muted-foreground">
                Finding the perfect matches for "{campaignData.sub_genre}" genre
              </p>
              <Progress value={66} className="w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          AI Playlist Recommendations
        </h1>
        <p className="text-muted-foreground">
          AI-powered playlist selection based on "{campaignData.sub_genre}" genre matching
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recommendations Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Playlists</p>
                    <p className="text-lg font-semibold">{genreMatches.length}</p>
                  </div>
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected</p>
                    <p className="text-lg font-semibold">{selectedPlaylists.size}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm text-muted-foreground">Total Projected Streams</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total streams over {campaignData.duration_days} days</p>
                            <p className="text-xs">({Math.round(projections.totalStreams / campaignData.duration_days).toLocaleString()} avg/day)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-lg font-semibold">{projections.totalStreams.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Over {campaignData.duration_days} days</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm text-muted-foreground">Goal Coverage</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Projected vs. target streams over campaign duration</p>
                            <p className="text-xs">{projections.totalStreams.toLocaleString()} / {campaignData.stream_goal.toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-lg font-semibold">
                      {((projections.totalStreams / campaignData.stream_goal) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Table */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Recommendations</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runAllocation}
                  disabled={isAllocating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              {allocations.length === 0 && genreMatches.length > 0 && (
                <CardDescription className="flex items-center space-x-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>No automatic allocations made. Playlists may lack performance data. You can still manually select playlists below.</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Playlist</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Daily Streams</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average daily streams for this playlist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Campaign Total</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total streams allocated over {campaignData.duration_days} days</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genreMatches.slice(0, 20).map((match) => {
                    const playlist = match.playlist;
                    const allocation = allocations.find(a => a.playlist_id === playlist.id);
                    const isSelected = selectedPlaylists.has(playlist.id);
                    
                    return (
                      <TableRow 
                        key={playlist.id} 
                        className={`${isSelected ? 'bg-primary/10 border-primary/30' : ''} hover:bg-accent/20`}
                      >
                        <TableCell>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => togglePlaylist(playlist.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{playlist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Vendor: {vendors?.find(v => v.id === playlist.vendor_id)?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {playlist.genres.slice(0, 2).map((genre) => (
                              <Badge 
                                key={genre} 
                                variant={genre === campaignData.sub_genre ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                            {playlist.genres.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{playlist.genres.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={match.relevanceScore * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-xs font-mono">
                              {(match.relevanceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-secondary" />
                            <span className="text-sm">{playlist.avg_daily_streams.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSelected && (
                            <Input
                              type="number"
                              value={manualAllocations[playlist.id] || (allocation?.allocation) || Math.min(1000 * campaignData.duration_days, (playlist.avg_daily_streams || 100) * campaignData.duration_days)}
                              onChange={(e) => updateManualAllocation(playlist.id, parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-xs"
                              placeholder="Streams"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={playlist.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <Card className="bg-gradient-glow border-primary/20 sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Allocation Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Goal</span>
                  <span className="font-mono text-sm">{campaignData.stream_goal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Projected Total</span>
                  <span className="font-mono text-sm text-primary">
                    {projections.totalStreams.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {Math.round(projections.totalStreams / campaignData.duration_days).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coverage</span>
                  <span className="font-mono text-sm">
                    {((projections.totalStreams / campaignData.stream_goal) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Playlists</span>
                  <span className="font-mono text-sm">{selectedPlaylists.size}</span>
                </div>
                
                <Progress 
                  value={(projections.totalStreams / campaignData.stream_goal) * 100} 
                  className="h-2"
                />
              </div>

              {!validation.isValid && (
                <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Validation Errors</span>
                  </div>
                  <ul className="text-xs text-destructive space-y-1">
                    {validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border/30">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configuration
        </Button>
        
        <Button 
          onClick={handleContinue}
          className="bg-gradient-primary hover:opacity-80 shadow-glow"
          disabled={selectedPlaylists.size === 0 || !validation.isValid}
        >
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}