import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Music, TrendingUp, Target, ExternalLink, RotateCcw, Plus, X } from 'lucide-react';
import { useUpdatePlaylistAllocation } from '@/hooks/useVendorCampaigns';
import { useMyPlaylists } from '@/hooks/useVendorPlaylists';
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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
          <DialogDescription>
            {campaign.brand_name && `${campaign.brand_name} • `}
            Campaign Performance & Playlist Management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Playlist Management */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="font-medium">Playlist Management</span>
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
            <div className="space-y-3">
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

            {/* Active Playlists */}
            <div className="space-y-3 pt-4 border-t">
              <div className="text-sm font-medium">Active Playlists:</div>
              {campaign.vendor_playlists?.filter((p: any) => p.is_allocated).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {campaign.vendor_playlists
                    .filter((playlist: any) => playlist.is_allocated)
                    .map((playlist: any) => (
                    <div key={playlist.id} className="flex items-center gap-2 p-2 bg-accent/10 border border-accent/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-accent truncate">{playlist.name}</div>
                        <div className="text-xs text-accent/80">
                          {playlist.avg_daily_streams.toLocaleString()} streams/day
                          {playlist.current_streams && (
                            <span className="ml-1">• {playlist.current_streams.toLocaleString()} campaign</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlaylistToggle(playlist.id, true)}
                        disabled={updatePlaylistAllocation.isPending}
                        className="h-6 w-6 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      >
                        {updatePlaylistAllocation.isPending ? (
                          <RotateCcw className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No playlists active in this campaign</p>
                  <p className="text-xs">Search above to add playlists or create new ones</p>
                </div>
              )}
            </div>
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
        </div>

        <div className="flex justify-end pt-4">
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