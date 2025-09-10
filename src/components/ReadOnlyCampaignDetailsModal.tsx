import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCampaignVendorResponses } from '@/hooks/useCampaignVendorResponses';

interface PlaylistWithStatus {
  id: string;
  name: string;
  url?: string;
  vendor_name?: string;
  status?: string;
  placed_date?: string;
}

interface ReadOnlyCampaignDetailsModalProps {
  campaign: any;
  open: boolean;
  onClose: () => void;
}

export function ReadOnlyCampaignDetailsModal({ campaign, open, onClose }: ReadOnlyCampaignDetailsModalProps) {
  const [campaignData, setCampaignData] = useState<any>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch vendor responses for this campaign
  const { data: vendorResponses = [], isLoading: vendorResponsesLoading } = useCampaignVendorResponses(campaign?.id);

  useEffect(() => {
    if (campaign?.id && open) {
      fetchCampaignDetails();
    }
  }, [campaign?.id, open]);

  const fetchCampaignDetails = async () => {
    if (!campaign?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaign.id)
        .single();

      if (error) throw error;

      setCampaignData(data as any);
      
      // Parse selected_playlists
      if (data?.selected_playlists) {
        const playlistsWithStatus = (data.selected_playlists as any[]).map(playlist => ({
          ...playlist,
          status: playlist.status || 'Pending',
          placed_date: playlist.placed_date || null
        }));
        setPlaylists(playlistsWithStatus);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Placed': return 'default';
      case 'Accepted': return 'secondary';
      case 'Pitched': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getVendorResponseVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getVendorResponseIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rejected': return <XCircle className="h-3 w-3 mr-1" />;
      case 'pending': return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Calculate commission (20% of budget)
  const commissionAmount = (campaignData?.budget || 0) * 0.2;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            Loading campaign details...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaignData?.name || campaign?.name}
            <Badge variant={getStatusVariant(campaignData?.status || 'draft')}>
              {campaignData?.status || 'draft'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg">
            <div>
              <Label className="text-muted-foreground">Client</Label>
              <p className="font-medium">{campaignData?.client_name || campaignData?.client}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Budget</Label>
              <p className="font-medium">${campaignData?.budget?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Stream Goal</Label>
              <p className="font-medium">{campaignData?.stream_goal?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Remaining Streams</Label>
              <p className="font-medium">{(campaignData?.remaining_streams || campaignData?.stream_goal)?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Genre</Label>
              <p className="font-medium">{campaignData?.sub_genre || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Duration</Label>
              <p className="font-medium">{campaignData?.duration_days} days</p>
            </div>
          </div>
          
          {/* Commission Info */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Label className="text-green-800 dark:text-green-200 font-medium">Your Commission</Label>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${commissionAmount.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              20% of ${campaignData?.budget?.toLocaleString()} campaign budget
            </div>
          </div>
          
          {/* Track URL */}
          {campaignData?.track_url && (
            <div className="p-4 bg-card rounded-lg">
              <Label className="text-muted-foreground">Track URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <a 
                  href={campaignData.track_url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {campaignData.track_url}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          
          {/* Vendor Responses */}
          {vendorResponses.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Vendor Responses ({vendorResponses.length})</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead> 
                    <TableHead>Requested Playlists</TableHead>
                    <TableHead>Response Notes</TableHead>
                    <TableHead>Response Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {(response.vendor as any)?.name || 'Unknown Vendor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getVendorResponseVariant(response.status)}>
                          {getVendorResponseIcon(response.status)}
                          {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {response.playlists && response.playlists.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {response.playlists.map((playlist) => (
                              <Badge key={playlist.id} variant="outline" className="text-xs">
                                {playlist.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No playlists</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {response.response_notes ? (
                          <span className="text-sm">{response.response_notes}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {response.responded_at ? (
                          <span className="text-sm">{formatDate(response.responded_at)}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Campaign Playlists - Read Only */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Campaign Playlists ({playlists.length})</Label>
            
            {playlists.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Playlist Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playlists.map((playlist, idx) => (
                    <TableRow key={`${playlist.id}-${idx}`}>
                      <TableCell>
                        {playlist.url ? (
                          <a 
                            href={playlist.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {playlist.name || 'Unnamed Playlist'}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{playlist.name || 'Unnamed Playlist'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {playlist.vendor_name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(playlist.status || 'Pending')}>
                          {playlist.status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {playlist.placed_date ? (
                          <span className="text-sm">{formatDate(playlist.placed_date)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                No playlists assigned to this campaign yet
              </div>
            )}
          </div>
          
          {/* Campaign Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg text-sm text-muted-foreground">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{campaignData?.created_at ? formatDate(campaignData.created_at) : 'Unknown'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p>{campaignData?.updated_at ? formatDate(campaignData.updated_at) : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}