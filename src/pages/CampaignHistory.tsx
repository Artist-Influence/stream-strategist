import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Copy,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  ExternalLink,
  Download,
  Upload,
  Edit
} from "lucide-react";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import { EditCampaignModal } from "@/components/EditCampaignModal";
import CampaignWeeklyImportModal from "@/components/CampaignWeeklyImportModal";

interface Campaign {
  id: string;
  name: string;
  client: string;
  client_name?: string;
  track_url: string;
  track_name?: string;
  stream_goal: number;
  remaining_streams: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
  status: string;
  selected_playlists: any;
  vendor_allocations: any;
  totals: any;
  created_at: string;
  updated_at: string;
  daily_streams?: number;
  weekly_streams?: number;
  playlists?: Array<{ name: string; url?: string; vendor_name?: string }>;
}

export default function CampaignHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; campaign?: Campaign }>({ open: false });
  const [editModal, setEditModal] = useState<{ open: boolean; campaign?: Campaign }>({ open: false });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mutations for campaign actions
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Campaign> }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been successfully removed.",
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (campaignIds: string[]) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .in('id', campaignIds);

      if (error) throw error;
    },
    onSuccess: (_, campaignIds) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedCampaigns(new Set());
      toast({
        title: "Campaigns Deleted",
        description: `${campaignIds.length} campaigns have been successfully removed.`,
      });
    }
  });

  // Filter campaigns with case-insensitive status matching
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         campaign.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  // Helper function for status counts
  const getStatusCount = (status: string) => {
    if (status === 'all') return campaigns?.length || 0;
    return campaigns?.filter(c => 
      c.status.toLowerCase() === status.toLowerCase()
    ).length || 0;
  };

  const handleStatusChange = (campaignId: string, newStatus: Campaign['status']) => {
    updateCampaignMutation.mutate({
      id: campaignId,
      updates: { status: newStatus }
    });

    toast({
      title: "Status Updated",
      description: `Campaign status changed to ${newStatus}.`,
    });
  };

  const handleDelete = (campaignId: string) => {
    if (confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleViewDetails = (campaignId: string) => {
    const campaign = campaigns?.find(c => c.id === campaignId);
    setDetailsModal({ open: true, campaign });
  };

  const handleEditCampaign = (campaignId: string) => {
    const campaign = campaigns?.find(c => c.id === campaignId);
    setEditModal({ open: true, campaign });
  };

  const exportCampaigns = async () => {
    try {
      if (!campaigns || campaigns.length === 0) return;
      
      const csvData = campaigns.map(campaign => ({
        'Campaign Name': campaign.name,
        'Client': campaign.client_name || '',
        'Status': campaign.status,
        'Budget': campaign.budget,
        'Stream Goal': campaign.stream_goal,
        'Daily Streams': campaign.daily_streams || 0,
        'Weekly Streams': campaign.weekly_streams || 0,
        'Remaining Streams': campaign.remaining_streams || campaign.stream_goal,
        'Progress': `${Math.round(((campaign.stream_goal - campaign.remaining_streams) || 0) / campaign.stream_goal * 100)}%`,
        'Start Date': campaign.start_date,
        'Playlists': campaign.playlists?.map(p => 
          typeof p === 'string' ? p : p.name
        ).join(', ') || ''
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Campaigns exported successfully",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export campaigns",
        variant: "destructive",
      });
    }
  };

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    setSelectedCampaigns(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(campaignId);
      } else {
        newSet.delete(campaignId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(new Set(filteredCampaigns.map(c => c.id)));
    } else {
      setSelectedCampaigns(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedCampaigns.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCampaigns.size} campaigns? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedCampaigns));
    }
  };

  const getStatusVariant = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'text-accent';
      case 'completed': return 'text-muted-foreground';
      case 'paused': return 'text-destructive';
      case 'draft': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          CAMPAIGN HISTORY
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage all your Spotify playlisting campaigns
        </p>
      </section>

      <div className="container mx-auto px-6 space-y-6">
        {/* Status Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All ({getStatusCount('all')})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
          >
            Active ({getStatusCount('active')})
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Draft ({getStatusCount('draft')})
          </Button>
          <Button
            variant={statusFilter === 'paused' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('paused')}
            size="sm"
          >
            Paused ({getStatusCount('paused')})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            size="sm"
          >
            Completed ({getStatusCount('completed')})
          </Button>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            {selectedCampaigns.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedCampaigns.size})
              </Button>
            )}
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import Updates
            </Button>
            <Button variant="outline" onClick={exportCampaigns}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button className="bg-gradient-primary hover:opacity-80" asChild>
              <Link to="/campaign/new">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
                </div>
                <Target className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-accent">
                    {campaigns?.filter(c => c.status === 'active').length || 0}
                  </p>
                </div>
                <Play className="w-5 h-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">
                    ${campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stream Goals</p>
                  <p className="text-2xl font-bold">
                    {(campaigns?.reduce((sum, c) => sum + (c.stream_goal || 0), 0) || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card className="metric-card">
          <CardHeader>
            <CardTitle>
              {statusFilter === 'all' ? 'All Campaigns' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Campaigns`}
            </CardTitle>
            <CardDescription>
              {filteredCampaigns.length} campaigns found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Get started by creating your first campaign"
                  }
                </p>
                <Button className="bg-gradient-primary hover:opacity-80" asChild>
                  <Link to="/campaign/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Campaign
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Stream Goal</TableHead>
                    <TableHead>Daily Streams</TableHead>
                    <TableHead>Weekly Streams</TableHead>
                    <TableHead>Remaining Streams</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const progress = ((campaign.stream_goal - campaign.remaining_streams) / campaign.stream_goal) * 100;
                    const endDate = new Date(campaign.start_date);
                    endDate.setDate(endDate.getDate() + campaign.duration_days);
                    const isExpired = new Date() > endDate;

                    return (
                      <TableRow key={campaign.id} className="hover:bg-accent/10">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCampaigns.has(campaign.id)}
                            onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {campaign.sub_genre}
                              </Badge>
                              <Button variant="ghost" size="sm" className="h-auto p-0" asChild>
                                <a href={campaign.track_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{campaign.client_name || campaign.client}</TableCell>
                        <TableCell>
                          <StatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                        <TableCell>{campaign.stream_goal.toLocaleString()}</TableCell>
                        <TableCell>{0}</TableCell>
                        <TableCell>{0}</TableCell>
                        <TableCell>{campaign.remaining_streams?.toLocaleString() || campaign.stream_goal.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{progress.toFixed(1)}%</span>
                              <span className="text-muted-foreground">
                                {(campaign.stream_goal - campaign.remaining_streams).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-muted h-1 rounded-full">
                              <div 
                                className="bg-primary h-1 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(campaign.start_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {campaign.updated_at 
                              ? new Date(campaign.updated_at).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(campaign.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCampaign(campaign.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {campaign.status === 'active' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(campaign.id, 'paused')}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              ) : campaign.status === 'paused' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(campaign.id, 'active')}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(campaign.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Campaign Details Modal */}
        <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ open })}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{detailsModal.campaign?.name}</DialogTitle>
            </DialogHeader>
            
            {detailsModal.campaign && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p className="text-sm">{detailsModal.campaign.client}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm capitalize">{detailsModal.campaign.status}</p>
                  </div>
                  <div>
                    <Label>Budget</Label>
                    <p className="text-sm">${detailsModal.campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Stream Goal</Label>
                    <p className="text-sm">{detailsModal.campaign.stream_goal.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Remaining Streams</Label>
                    <p className="text-sm">{(detailsModal.campaign.remaining_streams || detailsModal.campaign.stream_goal).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Genre</Label>
                    <p className="text-sm">{detailsModal.campaign.sub_genre}</p>
                  </div>
                </div>
                
                 <div>
                   <Label>Track URL</Label>
                   <a 
                     href={detailsModal.campaign.track_url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-400 hover:underline text-sm block"
                   >
                     {detailsModal.campaign.track_url}
                   </a>
                 </div>
                 
                 {/* PLAYLISTS SECTION */}
                 <div>
                   <Label className="text-lg font-semibold mb-3">Campaign Playlists</Label>
                   <div className="border rounded-lg p-4 bg-card/30">
                     {detailsModal.campaign.playlists && detailsModal.campaign.playlists.length > 0 ? (
                       <div className="space-y-2">
                         {detailsModal.campaign.playlists.map((playlist, idx) => (
                           <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded">
                              <a 
                                href={typeof playlist === 'string' ? '#' : (playlist.url || '#')} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline font-medium"
                              >
                                {typeof playlist === 'string' ? playlist : playlist.name}
                              </a>
                              <Badge variant="secondary">
                                {typeof playlist === 'string' ? 'Unknown Vendor' : (playlist.vendor_name || 'Unknown Vendor')}
                              </Badge>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-muted-foreground text-center py-4">No playlists assigned yet</p>
                     )}
                   </div>
                 </div>
                 
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{new Date(detailsModal.campaign.created_at).toLocaleDateString()}</p>
                  </div>
               </div>
             )}
           </DialogContent>
         </Dialog>

          {/* Edit Campaign Modal */}
          {editModal.campaign && (
            <EditCampaignModal
              campaign={editModal.campaign}
              open={editModal.open}
              onClose={() => setEditModal({ open: false })}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['campaigns'] });
              }}
            />
          )}

          {/* Import Campaign Updates Modal */}
          <CampaignWeeklyImportModal 
            open={importModalOpen} 
            onOpenChange={setImportModalOpen} 
          />
       </div>
     </div>
   );
 }