import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, TrendingUp, Target, ExternalLink, RotateCcw, Plus, Minus } from 'lucide-react';
import { useUpdatePlaylistAllocation } from '@/hooks/useVendorCampaigns';

interface VendorCampaignPerformanceModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorCampaignPerformanceModal({ campaign, isOpen, onClose }: VendorCampaignPerformanceModalProps) {
  const updatePlaylistAllocation = useUpdatePlaylistAllocation();

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
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-4 w-4" />
              <span className="font-medium">Your Playlists in Campaign</span>
            </div>
            
            {campaign.vendor_playlists && campaign.vendor_playlists.length > 0 ? (
              <div className="space-y-3">
                {campaign.vendor_playlists.map((playlist: any) => (
                  <div key={playlist.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{playlist.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {playlist.avg_daily_streams.toLocaleString()} daily streams
                          {playlist.current_streams && (
                            <span className="ml-2">• {playlist.current_streams.toLocaleString()} campaign streams</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {playlist.is_allocated && (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant={playlist.is_allocated ? "outline" : "default"}
                        size="sm"
                        onClick={() => handlePlaylistToggle(playlist.id, playlist.is_allocated)}
                        disabled={updatePlaylistAllocation.isPending}
                      >
                        {updatePlaylistAllocation.isPending ? (
                          <RotateCcw className="h-3 w-3 animate-spin" />
                        ) : playlist.is_allocated ? (
                          <>
                            <Minus className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No playlists assigned to this campaign yet.</p>
                <p className="text-sm">Contact your campaign manager to get playlists assigned.</p>
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
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}