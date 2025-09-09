import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { insertSampleData } from "@/lib/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { APP_CAMPAIGN_SOURCE, APP_CAMPAIGN_TYPE } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Activity,
  Plus,
  Zap,
  Music2,
  Database,
  Eye,
  BarChart3,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SalespeopleManager } from "@/components/SalespeopleManager";
import { ActiveVendorsCard } from "@/components/ActiveVendorsCard";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalStreamsGoal: number;
  totalBudget: number;
  completedCampaigns: number;
  totalVendors: number;
  totalPlaylists: number;
  totalReach: number;
  algorithmAccuracy: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Populate sample data on first load
  useEffect(() => {
    insertSampleData();
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [campaignsRes, vendorsRes, playlistsRes] = await Promise.all([
        supabase.from('campaigns').select('status, stream_goal, budget').eq('source', APP_CAMPAIGN_SOURCE).eq('campaign_type', APP_CAMPAIGN_TYPE),
        supabase.from('vendors').select('id').eq('is_active', true),
        supabase.from('playlists').select('id, avg_daily_streams, vendors!inner(is_active)').eq('vendors.is_active', true)
      ]);

      const campaigns = campaignsRes.data || [];
      const vendors = vendorsRes.data || [];
      const playlists = playlistsRes.data || [];

      const totalReach = playlists.reduce((sum, p) => sum + (p.avg_daily_streams || 0), 0);

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
        totalStreamsGoal: campaigns.reduce((sum, c) => sum + (c.stream_goal || 0), 0),
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalVendors: vendors.length,
        totalPlaylists: playlists.length,
        totalReach: totalReach,
        algorithmAccuracy: 95.0, // Mock data
      };
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center pt-16 pb-8">
        <h1 className="hero-title">
          SPOTIFY PLAYLISTING
        </h1>
        <h2 className="text-2xl font-bold text-foreground mt-2">
          CAMPAIGN BUILDER
        </h2>
        <p className="hero-subtitle">
          Internal operator dashboard for campaign management and playlist analytics
        </p>
      </section>

      {/* Action Buttons */}
      <section className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-4xl mx-auto">
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 h-auto text-base font-medium glow-primary transition-smooth"
            asChild
          >
            <Link to="/campaign/new">
              <Plus className="w-5 h-5 mr-2" />
              BUILD CAMPAIGN
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="px-8 py-4 h-auto text-base font-medium border-border hover:border-primary/50 transition-smooth"
            asChild
          >
            <Link to="/playlists">
              <Database className="w-5 h-5 mr-2" />
              BROWSE PLAYLISTS
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="px-8 py-4 h-auto text-base font-medium border-border hover:border-primary/50 transition-smooth"
            asChild
          >
            <Link to="/campaigns">
              <BarChart3 className="w-5 h-5 mr-2" />
              VIEW CAMPAIGNS
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="feature-card">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Smart Algorithms</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered playlist matching based on genre, territory, and performance data
            </p>
          </div>
          
          <div className="feature-card">
            <div className="flex items-center justify-center w-12 h-12 bg-accent/20 rounded-lg mb-4">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Budget Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Maximize reach within budget using cost-per-stream analysis and efficiency scoring
            </p>
          </div>
          
          <div className="feature-card">
            <div className="flex items-center justify-center w-12 h-12 bg-secondary/20 rounded-lg mb-4">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Playlist Database</h3>
            <p className="text-sm text-muted-foreground">
              Performance tracking and analytics for continuous algorithm improvement
            </p>
          </div>
          
          <div className="feature-card">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Campaign Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track actual performance vs predictions to improve future recommendations
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="metric-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Total Playlists</h3>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.totalPlaylists || 0}
              </p>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUpIcon className="w-3 h-3 text-accent" />
                <span className="text-accent">+12%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </div>

          <div className="metric-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Total Reach</h3>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : formatNumber(stats?.totalReach || 0)}
              </p>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUpIcon className="w-3 h-3 text-accent" />
                <span className="text-accent">+8%</span>
                <span className="text-muted-foreground">streams available</span>
              </div>
            </div>
          </div>

          <div className="metric-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-muted-foreground">Active Campaigns</h3>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.activeCampaigns || 0}
              </p>
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUpIcon className="w-3 h-3 text-accent" />
                <span className="text-accent">+15%</span>
                <span className="text-muted-foreground">of {stats?.totalCampaigns || 0} total</span>
              </div>
            </div>
          </div>

          <ActiveVendorsCard />
        </div>
      </section>

      {/* Charts Section Placeholder */}
      <section className="container mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">All Genres by Reach</h3>
              </div>
              <div className="space-y-4">
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/playlists?genre=Electronic')}
                  title="Click to view Electronic playlists"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-primary transition-colors">Electronic</span>
                    <span className="text-muted-foreground">29.0M reach</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-primary h-2 rounded-full group-hover:bg-primary/80 transition-colors" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80">74 playlists</div>
                </div>
                
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/playlists?genre=Hip-Hop')}
                  title="Click to view Hip-Hop playlists"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-primary transition-colors">Hip-Hop</span>
                    <span className="text-muted-foreground">28.0M reach</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-primary h-2 rounded-full group-hover:bg-primary/80 transition-colors" style={{ width: '82%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80">66 playlists</div>
                </div>
                
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/playlists?genre=Indie')}
                  title="Click to view Indie playlists"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-primary transition-colors">Indie</span>
                    <span className="text-muted-foreground">22.5M reach</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-primary h-2 rounded-full group-hover:bg-primary/80 transition-colors" style={{ width: '65%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80">45 playlists</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Campaign Performance</h3>
              </div>
              <div className="space-y-4">
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/campaigns?performance=high')}
                  title="Click to view high performing campaigns"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-accent transition-colors">High Performers (completes &lt;75 days)</span>
                    <span className="text-muted-foreground">{Math.floor((stats?.activeCampaigns || 0) * 0.3)} campaigns</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-accent h-2 rounded-full group-hover:bg-accent/80 transition-colors" style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/campaigns?performance=on-track')}
                  title="Click to view campaigns on track"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-primary transition-colors">On Track (completes 75-90 days)</span>
                    <span className="text-muted-foreground">{Math.floor((stats?.activeCampaigns || 0) * 0.55)} campaigns</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-purple h-2 rounded-full group-hover:bg-purple/80 transition-colors" style={{ width: '55%' }}></div>
                  </div>
                </div>
                
                <div
                  className="cursor-pointer group transition-all hover:bg-muted/50 rounded p-2 -m-2"
                  onClick={() => navigate('/campaigns?performance=under-performing')}
                  title="Click to view under-performing campaigns"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="group-hover:text-destructive transition-colors">Under-Performers (&gt;90 days)</span>
                    <span className="text-muted-foreground">{Math.floor((stats?.activeCampaigns || 0) * 0.15)} campaigns</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full group-hover:bg-muted/80 transition-colors">
                    <div className="bg-destructive h-2 rounded-full group-hover:bg-destructive/80 transition-colors" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Salespeople Management Section */}
      <section className="container mx-auto px-6 pb-12">
        <SalespeopleManager />
      </section>

      {/* Public Intake Form Link */}
      <section className="container mx-auto px-6 pb-12">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/20 rounded-lg mb-4 mx-auto">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Campaign Intake Form</h3>
            <p className="text-muted-foreground mb-4">
              Share this link with salespeople to submit new campaigns for approval
            </p>
            <div className="bg-muted p-3 rounded-lg mb-4">
              <code className="text-sm text-foreground">
                {window.location.origin}/campaign-intake
              </code>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/campaign-intake`)}
                variant="outline"
              >
                Copy Link
              </Button>
              <Button asChild>
                <Link to="/campaign-intake" target="_blank">
                  Open Form
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}