import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, TrendingUp, Target, ExternalLink, RotateCcw, Plus, X, BarChart3 } from 'lucide-react';
import { useUpdatePlaylistAllocation } from '@/hooks/useVendorCampaigns';
import { useMyPlaylists } from '@/hooks/useVendorPlaylists';
import { useCampaignPerformanceData, useCampaignOverallPerformance } from '@/hooks/useCampaignPerformanceData';
import { VendorPerformanceChart } from '@/components/VendorPerformanceChart';
import { VendorGroupedPlaylistView } from '@/components/VendorGroupedPlaylistView';
import AddPlaylistModal from '@/components/AddPlaylistModal';

interface VendorCampaignPerformanceModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorCampaignPerformanceModal({ campaign, isOpen, onClose }: VendorCampaignPerformanceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  
  const updatePlaylistAllocation = useUpdatePlaylistAllocation();
  const { data: myPlaylists } = useMyPlaylists();
  const { data: performanceData, isLoading: performanceLoading } = useCampaignPerformanceData(campaign?.id);
  const { data: overallPerformance } = useCampaignOverallPerformance(campaign?.id);

  if (!campaign) return null;

  const vendorStreamGoal = campaign.vendor_stream_goal || 0;
  const currentStreams = campaign.vendor_playlists?.reduce((sum: number, p: any) => 
    p.is_allocated ? (p.current_streams || 0) : 0, 0) || 0;
  const progressPercentage = vendorStreamGoal > 0 ? (currentStreams / vendorStreamGoal) * 100 : 0;

  const getPerformanceStatus = () => {
    if (progressPercentage >= 110) return { status: 'Exceeding', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (progressPercentage >= 80) return { status: 'On Track', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (progressPercentage >= 50) return { status: 'Behind', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Needs Attention', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const performance = getPerformanceStatus();

  const handlePlaylistToggle = (playlistId: string, isCurrentlyActive: boolean) => {
    updatePlaylistAllocation.mutate({
      campaignId: campaign.id,
      playlistId: playlistId,
      action: isCurrentlyActive ? 'remove' : 'add'
    });
  };

  // Filter playlists based on search query
  const filteredAvailablePlaylists = myPlaylists?.filter(playlist => 
    !campaign.vendor_playlists?.some((vp: any) => vp.id === playlist.id && vp.is_allocated) &&
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle adding playlist by search or URL
  const handleAddPlaylist = (playlistId: string) => {
    handlePlaylistToggle(playlistId, false);
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {campaign.name}
            <Badge variant="outline" className="text-xs">
              {overallPerformance?.progress_percentage.toFixed(1)}% complete
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {campaign.brand_name && `${campaign.brand_name} • `}
            Campaign Performance & Playlist Management
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Your Stream Goal</span>
              </div>
              <div className="text-2xl font-bold">{vendorStreamGoal.toLocaleString()}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Current Streams</span>
              </div>
              <div className="text-2xl font-bold">{currentStreams.toLocaleString()}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <div className={`w-3 h-3 rounded-full ${performance.bgColor}`}></div>
                <span className="text-sm font-medium">Status</span>
              </div>
              <div className={`text-lg font-semibold ${performance.color}`}>
                {performance.status}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Goal</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} className="h-3" />
          </div>

          {/* Track Information */}
          {campaign.track_url && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-4 w-4" />
                <span className="font-medium">Campaign Track</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(campaign.track_url, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                {campaign.track_name || 'Listen to Track'}
              </Button>
            </div>
          )}

            {/* Campaign Playlists - Grouped by Vendor */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="font-medium">Campaign Playlists by Vendor</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setShowAddPlaylistModal(true)}
              >
                <Plus className="h-3 w-3" />
                Add New Playlist
              </Button>
            </div>
            
            {/* Search Bar for Adding Playlists */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search playlists by name or paste Spotify URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery && filteredAvailablePlaylists.length > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {filteredAvailablePlaylists.map((playlist) => (
                    <div 
                      key={playlist.id} 
                      className="flex items-center justify-between p-2 hover:bg-muted/10 border-b last:border-0 cursor-pointer"
                      onClick={() => handleAddPlaylist(playlist.id)}
                    >
                      <div>
                        <div className="font-medium text-sm">{playlist.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {playlist.avg_daily_streams.toLocaleString()} daily streams
                        </div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && filteredAvailablePlaylists.length === 0 && (
                <div className="text-center py-2 text-sm text-muted-foreground border rounded-lg">
                  No playlists found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Vendor Grouped Playlist View */}
            {performanceData && performanceData.length > 0 ? (
              <VendorGroupedPlaylistView
                vendorData={performanceData.map(vendor => ({
                  vendor_id: vendor.vendor_id,
                  vendor_name: vendor.vendor_name,
                  total_daily_streams: vendor.playlists.reduce((sum, p) => sum + (p.daily_data.length > 0 ? p.daily_data[p.daily_data.length - 1].streams : 0), 0),
                  total_twelve_month_streams: vendor.playlists.reduce((sum, p) => sum + p.actual_streams, 0), // Using actual streams as proxy for now
                  playlists: vendor.playlists.map(playlist => ({
                    id: playlist.id,
                    name: playlist.name,
                    url: '#', // URL would come from playlists table
                    allocated_streams: playlist.allocated_streams,
                    actual_streams: playlist.actual_streams,
                    twelve_month_streams: playlist.actual_streams, // Using actual streams as proxy for now
                    daily_data: playlist.daily_data,
                    is_allocated: true
                  }))
                }))}
                onRemovePlaylist={(playlistId) => handlePlaylistToggle(playlistId, true)}
                isRemoving={updatePlaylistAllocation.isPending}
                showHistoricalData={true}
              />
            ) : (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No playlists active in this campaign</p>
                <p className="text-xs">Search above to add playlists or create new ones</p>
              </div>
            )}
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <span className="font-medium text-muted-foreground">Start Date:</span>
              <div className="mt-1">
                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not specified'}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <span className="font-medium text-muted-foreground">Duration:</span>
              <div className="mt-1">{campaign.duration_days || 0} days</div>
            </div>
          </div>

          {/* Genres */}
          {campaign.music_genres && campaign.music_genres.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-2">Music Genres</div>
              <div className="flex flex-wrap gap-1">
                {campaign.music_genres.map((genre: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {performanceLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading performance data...</div>
              </div>
            ) : performanceData && performanceData.length > 0 ? (
              <VendorPerformanceChart 
                data={performanceData} 
                campaignGoal={campaign.stream_goal || 0} 
              />
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-lg font-semibold mb-2">No Performance Data Available</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Performance data will appear here once the campaign starts collecting stream data from Spotify.
                </div>
                <div className="text-xs text-muted-foreground">
                  Data is collected through web scraping and updated weekly.
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Add New Playlist Modal */}
        <AddPlaylistModal
          open={showAddPlaylistModal}
          onOpenChange={setShowAddPlaylistModal}
        />
      </DialogContent>
    </Dialog>
  );
}