import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UNIFIED_GENRES } from '@/lib/constants';

interface Campaign {
  id: string;
  name: string;
  client: string;
  client_name?: string;
  track_url?: string;
  status: string;
  stream_goal: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
  daily_streams?: number;
  weekly_streams?: number;
  remaining_streams?: number;
  playlists?: Array<{ name: string; url?: string; vendor_name?: string }>;
}

interface EditCampaignModalProps {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCampaignModal({ campaign, open, onClose, onSuccess }: EditCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: campaign.name,
    client_name: campaign.client_name || campaign.client,
    track_url: campaign.track_url || '',
    status: campaign.status,
    stream_goal: campaign.stream_goal,
    budget: campaign.budget,
    sub_genre: campaign.sub_genre,
    start_date: campaign.start_date,
    duration_days: campaign.duration_days,
    daily_streams: campaign.daily_streams || 0,
    weekly_streams: campaign.weekly_streams || 0,
    remaining_streams: campaign.remaining_streams || campaign.stream_goal,
    playlists: campaign.playlists || []
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          client_name: formData.client_name,
          track_url: formData.track_url,
          status: formData.status,
          stream_goal: formData.stream_goal,
          budget: formData.budget,
          sub_genre: formData.sub_genre,
          start_date: formData.start_date,
          duration_days: formData.duration_days,
          daily_streams: formData.daily_streams,
          weekly_streams: formData.weekly_streams,
          remaining_streams: formData.remaining_streams
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Client</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              />
            </div>
            
            {/* Track URL field */}
            <div className="col-span-2">
              <Label>Spotify Track URL</Label>
              <Input 
                value={formData.track_url} 
                onChange={(e) => setFormData({...formData, track_url: e.target.value})}
                placeholder="https://open.spotify.com/track/..."
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stream Goal</Label>
              <Input
                type="number"
                value={formData.stream_goal}
                onChange={(e) => setFormData({...formData, stream_goal: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Budget ($)</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Duration (Days)</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 90})}
              />
            </div>
          </div>
          
          {/* Streaming Data Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Streaming Data</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Daily Streams</Label>
                <Input 
                  type="number" 
                  value={formData.daily_streams} 
                  onChange={(e) => setFormData({...formData, daily_streams: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Weekly Streams</Label>
                <Input 
                  type="number" 
                  value={formData.weekly_streams} 
                  onChange={(e) => setFormData({...formData, weekly_streams: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Remaining Streams</Label>
                <Input 
                  type="number" 
                  value={formData.remaining_streams} 
                  onChange={(e) => setFormData({...formData, remaining_streams: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          
          {/* Playlist Management */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Campaign Playlists</h3>
            
            {formData.playlists.length > 0 ? (
              <div className="space-y-2">
                {formData.playlists.map((playlist, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>{typeof playlist === 'string' ? playlist : playlist.name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        const newPlaylists = [...formData.playlists];
                        newPlaylists.splice(idx, 1);
                        setFormData({...formData, playlists: newPlaylists});
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No playlists assigned</p>
            )}
          </div>
          
          <div>
            <Label>Sub-Genre</Label>
            <Select 
              value={formData.sub_genre}
              onValueChange={(value) => setFormData({...formData, sub_genre: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIFIED_GENRES.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}