import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Download
} from "lucide-react";
import { Link } from "react-router-dom";

interface Campaign {
  id: string;
  name: string;
  client: string;
  track_url: string;
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
}

export default function CampaignHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline">
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
            <CardTitle>All Campaigns</CardTitle>
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
                    <TableHead>Campaign</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Stream Goal</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
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
                        <TableCell>{campaign.client}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(campaign.status)} className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                        <TableCell>{campaign.stream_goal.toLocaleString()}</TableCell>
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
                            {new Date(campaign.created_at).toLocaleDateString()}
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
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
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
      </div>
    </div>
  );
}