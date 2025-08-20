import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft, 
  CheckCircle, 
  Target,
  DollarSign,
  TrendingUp,
  Users,
  ExternalLink,
  Rocket,
  AlertTriangle,
  Calendar,
  Clock
} from "lucide-react";
import { Vendor, Playlist } from "@/types";
import { useNavigate } from "react-router-dom";
import { APP_CAMPAIGN_SOURCE, APP_CAMPAIGN_TYPE } from "@/lib/constants";

interface CampaignReviewProps {
  campaignData: {
    name: string;
    client: string;
    track_url: string;
    stream_goal: number;
    budget: number;
    sub_genre: string;
    start_date: string;
    duration_days: number;
  };
  allocationsData: {
    allocations: any[];
    projections: any;
    selectedPlaylists: string[];
  };
  onBack: () => void;
}

export default function CampaignReview({ campaignData, allocationsData, onBack }: CampaignReviewProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            name: campaignData.name,
            brand_name: campaignData.client,
            client: campaignData.client,
            track_url: campaignData.track_url,
            stream_goal: campaignData.stream_goal,
            remaining_streams: campaignData.stream_goal,
            budget: campaignData.budget,
            sub_genre: campaignData.sub_genre,
            start_date: campaignData.start_date,
            duration_days: campaignData.duration_days,
            status: 'active',
            source: APP_CAMPAIGN_SOURCE,
            campaign_type: APP_CAMPAIGN_TYPE,
            selected_playlists: allocationsData.selectedPlaylists,
            vendor_allocations: allocationsData.allocations.reduce((acc: any, alloc: any) => {
              acc[alloc.vendor_id] = (acc[alloc.vendor_id] || 0) + alloc.allocation;
              return acc;
            }, {}),
            totals: {
              projected_streams: allocationsData.projections.totalStreams
            },
            music_genres: [campaignData.sub_genre],
            content_types: ['playlist'],
            territory_preferences: ['US'],
            post_types: ['playlist']
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: "Campaign Launched! 🚀",
        description: `${campaign.name} is now active and running.`,
      });
      
      navigate('/campaigns');
    },
    onError: (error) => {
      toast({
        title: "Launch Failed",
        description: "There was an error launching your campaign. Please try again.",
        variant: "destructive",
      });
      console.error('Campaign creation error:', error);
    }
  });

  const handleLaunch = async () => {
    setIsLaunching(true);
    await createCampaignMutation.mutateAsync();
    setIsLaunching(false);
  };

  const calculateCPSt = () => {
    return (campaignData.budget / campaignData.stream_goal).toFixed(4);
  };

  const coverage = (allocationsData.projections.totalStreams / campaignData.stream_goal) * 100;
  const endDate = new Date(campaignData.start_date);
  endDate.setDate(endDate.getDate() + campaignData.duration_days);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          Campaign Review & Launch
        </h1>
        <p className="text-muted-foreground">
          Review your campaign details and launch when ready
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Overview */}
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Campaign Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Campaign Name</h4>
                  <p className="text-lg font-semibold">{campaignData.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                  <p className="text-lg font-semibold">{campaignData.client}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Sub-Genre</h4>
                  <Badge className="bg-primary/20 text-primary">{campaignData.sub_genre}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Track URL</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={campaignData.track_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open Track
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                  <p className="text-lg font-semibold">
                    {new Date(campaignData.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                  <p className="text-lg font-semibold">{campaignData.duration_days} days</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                  <p className="text-lg font-semibold">
                    {endDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Summary */}
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Playlist Allocation Summary</span>
              </CardTitle>
              <CardDescription>
                {allocationsData.selectedPlaylists.length} playlists selected for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {allocationsData.projections.totalStreams.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Projected Streams</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {coverage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Goal Coverage</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">
                      {allocationsData.selectedPlaylists.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Playlists</p>
                  </div>
                </div>

                {coverage < 80 && (
                  <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <span className="font-medium text-destructive">Low Coverage Warning</span>
                    </div>
                    <p className="text-sm text-destructive mt-1">
                      Your current allocation only covers {coverage.toFixed(1)}% of your stream goal. 
                      Consider adjusting your budget or playlist selection.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Budget Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    ${campaignData.budget.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    ${calculateCPSt()}
                  </p>
                  <p className="text-sm text-muted-foreground">Cost per Stream</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">
                    {campaignData.stream_goal.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Target Streams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Launch Card */}
          <Card className="gradient-feature border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-primary" />
                <span>Ready to Launch?</span>
              </CardTitle>
              <CardDescription>
                Your campaign is configured and ready to go live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm">Campaign configured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm">Playlists selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm">Budget allocated</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm">Ready for launch</span>
                </div>
              </div>

              <Button 
                onClick={handleLaunch}
                disabled={isLaunching}
                className="w-full bg-gradient-primary hover:opacity-80 glow-primary transition-smooth"
              >
                {isLaunching ? (
                  <>Launching...</>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected Daily Streams</span>
                <span className="text-sm font-medium">
                  {Math.round(allocationsData.projections.totalStreams / campaignData.duration_days).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Daily Budget</span>
                <span className="text-sm font-medium">
                  ${(campaignData.budget / campaignData.duration_days).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vendors Involved</span>
                <span className="text-sm font-medium">
                  {Object.keys(allocationsData.projections.vendorBreakdown || {}).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recommendations
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Campaign will be launched immediately and set to active status
        </div>
      </div>
    </div>
  );
}