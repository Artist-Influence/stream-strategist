import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, ExternalLink, Music, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useMyPlaylists, useCreatePlaylist, useUpdatePlaylist, useDeletePlaylist } from '@/hooks/useVendorPlaylists';
import { usePlaylistHistoricalPerformance, useCampaignPaceAnalysis } from '@/hooks/usePlaylistHistoricalPerformance';
import { useVendorCampaigns } from '@/hooks/useVendorCampaigns';
import { CampaignPaceIndicator } from '@/components/CampaignPaceIndicator';
import { toast } from 'sonner';

export default function VendorPlaylistManager() {
  const { data: playlists, isLoading } = useMyPlaylists();
  const { data: vendorCampaigns } = useVendorCampaigns();
  const createMutation = useCreatePlaylist();
  const updateMutation = useUpdatePlaylist();
  const deleteMutation = useDeletePlaylist();
  
  // Get playlist IDs for historical performance data
  const playlistIds = playlists?.map(p => p.id) || [];
  const campaignIds = vendorCampaigns?.map(c => c.id) || [];
  
  const { data: historicalPerformance } = usePlaylistHistoricalPerformance(playlistIds);
  const { data: campaignPaceData } = useCampaignPaceAnalysis(campaignIds);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    genres: [] as string[],
    avg_daily_streams: 0,
    follower_count: 0
  });
  const [genreInput, setGenreInput] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      genres: [],
      avg_daily_streams: 0,
      follower_count: 0
    });
    setGenreInput('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      toast.error('Name and URL are required');
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist?.id) return;

    updateMutation.mutate({
      id: editingPlaylist.id,
      ...formData
    }, {
      onSuccess: () => {
        setEditingPlaylist(null);
        resetForm();
      }
    });
  };

  const handleDelete = async (playlistId: string) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      deleteMutation.mutate(playlistId);
    }
  };

  const handleEditClick = (playlist: any) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      url: playlist.url,
      genres: playlist.genres || [],
      avg_daily_streams: playlist.avg_daily_streams,
      follower_count: playlist.follower_count || 0
    });
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genreInput.trim()]
      }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Pace Overview */}
      {campaignPaceData && campaignPaceData.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Active Campaign Status</h3>
            <p className="text-sm text-muted-foreground">Monitor your campaign progress and pace</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaignPaceData.map((campaign) => (
              <CampaignPaceIndicator
                key={campaign.campaign_id}
                currentStreams={campaign.current_streams}
                goalStreams={campaign.goal_streams}
                daysElapsed={campaign.days_elapsed}
                daysRemaining={campaign.days_remaining}
                projectedCompletionPercentage={campaign.projected_completion_percentage}
                isOnTrack={campaign.is_on_track}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Playlists</h2>
          <p className="text-muted-foreground">
            Manage your playlists with 12-month performance tracking
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Playlist</DialogTitle>
              <DialogDescription>
                Add a new playlist to make it available for campaign participation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Playlist name"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">Spotify URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="col-span-3"
                    placeholder="https://open.spotify.com/playlist/..."
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="streams" className="text-right">Daily Streams</Label>
                  <Input
                    id="streams"
                    type="number"
                    value={formData.avg_daily_streams}
                    onChange={(e) => setFormData(prev => ({ ...prev, avg_daily_streams: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="Average daily streams"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="followers" className="text-right">Followers</Label>
                  <Input
                    id="followers"
                    type="number"
                    value={formData.follower_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, follower_count: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="Number of followers"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Genres</Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        placeholder="Add genre"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                      />
                      <Button type="button" onClick={addGenre} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="cursor-pointer" onClick={() => removeGenre(genre)}>
                          {genre} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Playlist'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {playlists?.map((playlist) => {
          const historicalData = historicalPerformance?.find(hp => hp.playlist_id === playlist.id);
          const activeCampaigns = historicalData?.campaign_performance?.length || 0;
          const totalCampaignStreams = historicalData?.campaign_performance?.reduce((sum, cp) => sum + cp.streams_contributed, 0) || 0;

          return (
            <Card key={playlist.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    {playlist.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(playlist)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(playlist.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {activeCampaigns > 0 && (
                  <Badge variant="secondary" className="w-fit">
                    {activeCampaigns} active campaigns
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      View on Spotify
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Daily Streams</span>
                      </div>
                      <div className="font-medium">{playlist.avg_daily_streams.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>12 Month Total</span>
                      </div>
                      <div className="font-medium">
                        {historicalData?.total_streams_12_months.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>

                  {totalCampaignStreams > 0 && (
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <div className="text-xs text-muted-foreground">Campaign Contributions</div>
                      <div className="font-medium text-sm">{totalCampaignStreams.toLocaleString()} streams</div>
                    </div>
                  )}

                  {playlist.follower_count && (
                    <div className="text-sm text-muted-foreground">
                      {playlist.follower_count.toLocaleString()} followers
                    </div>
                  )}
                  
                  {playlist.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {playlist.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {playlist.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{playlist.genres.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {playlists?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No playlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first playlist to start participating in campaigns
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Playlist
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingPlaylist} onOpenChange={() => setEditingPlaylist(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-url" className="text-right">Spotify URL</Label>
                <Input
                  id="edit-url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-streams" className="text-right">Daily Streams</Label>
                <Input
                  id="edit-streams"
                  type="number"
                  value={formData.avg_daily_streams}
                  onChange={(e) => setFormData(prev => ({ ...prev, avg_daily_streams: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-followers" className="text-right">Followers</Label>
                <Input
                  id="edit-followers"
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, follower_count: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Genres</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      placeholder="Add genre"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    />
                    <Button type="button" onClick={addGenre} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="cursor-pointer" onClick={() => removeGenre(genre)}>
                        {genre} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPlaylist(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Playlist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}