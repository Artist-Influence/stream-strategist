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
  status: string;
  stream_goal: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
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
    status: campaign.status,
    stream_goal: campaign.stream_goal,
    budget: campaign.budget,
    sub_genre: campaign.sub_genre,
    start_date: campaign.start_date,
    duration_days: campaign.duration_days
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
          status: formData.status,
          stream_goal: formData.stream_goal,
          budget: formData.budget,
          sub_genre: formData.sub_genre,
          start_date: formData.start_date,
          duration_days: formData.duration_days
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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