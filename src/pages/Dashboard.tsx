import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { insertSampleData } from "@/lib/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Activity,
  Plus,
  Zap,
  Music2,
  Database
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalStreamsGoal: number;
  totalBudget: number;
  completedCampaigns: number;
  totalVendors: number;
  totalPlaylists: number;
}

export default function Dashboard() {
  // Populate sample data on first load
  useEffect(() => {
    insertSampleData();
  }, []);
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [campaignsRes, vendorsRes, playlistsRes] = await Promise.all([
        supabase.from('campaigns').select('status, stream_goal, budget'),
        supabase.from('vendors').select('id'),
        supabase.from('playlists').select('id')
      ]);

      const campaigns = campaignsRes.data || [];
      const vendors = vendorsRes.data || [];
      const playlists = playlistsRes.data || [];

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
        totalStreamsGoal: campaigns.reduce((sum, c) => sum + (c.stream_goal || 0), 0),
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalVendors: vendors.length,
        totalPlaylists: playlists.length,
      };
    }
  });

  const statCards = [
    {
      title: "Total Campaigns",
      value: stats?.totalCampaigns || 0,
      description: `${stats?.activeCampaigns || 0} active • ${stats?.completedCampaigns || 0} completed`,
      icon: Target,
      trend: "+12% from last month",
      color: "text-primary"
    },
    {
      title: "Stream Goals",
      value: (stats?.totalStreamsGoal || 0).toLocaleString(),
      description: "Combined stream targets",
      icon: TrendingUp,
      trend: "+8.2% from last month",
      color: "text-secondary"
    },
    {
      title: "Total Budget", 
      value: `$${(stats?.totalBudget || 0).toLocaleString()}`,
      description: "Allocated campaign budgets",
      icon: DollarSign,
      trend: "+15.3% from last month", 
      color: "text-accent"
    },
    {
      title: "Active Vendors",
      value: stats?.totalVendors || 0,
      description: `${stats?.totalPlaylists || 0} total playlists`,
      icon: Database,
      trend: "+2 new this week",
      color: "text-primary"
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Campaign Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your Spotify playlisting campaigns and track performance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link to="/vendors">
              <Database className="w-4 h-4 mr-2" />
              Manage Playlists
            </Link>
          </Button>
          <Button className="bg-gradient-primary hover:opacity-80 transition-all shadow-glow" asChild>
            <Link to="/campaign/new">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/70 transition-all hover:shadow-subtle group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color} group-hover:drop-shadow-[0_0_8px_currentColor] transition-all`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {isLoading ? (
                    <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
                  ) : (
                    <span className={stat.color}>{stat.value}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {stat.description}
                </p>
                <p className="text-xs text-secondary font-medium">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-glow border-primary/20 hover:border-primary/40 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Quick Campaign Builder</span>
            </CardTitle>
            <CardDescription>
              Launch a new playlisting campaign with AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Button className="flex-1 bg-gradient-primary hover:opacity-80" asChild>
                <Link to="/campaign/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Build Campaign
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/campaigns">
                  View History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-glow border-secondary/20 hover:border-secondary/40 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music2 className="w-5 h-5 text-secondary" />
              <span>Playlist Network</span>
            </CardTitle>
            <CardDescription>
              Manage your vendor relationships and playlist database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Button variant="secondary" className="flex-1" asChild>
                <Link to="/vendors">
                  <Database className="w-4 h-4 mr-2" />
                  Manage Network
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/import">
                  Import Data
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="bg-card/30 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Recent campaigns and updates will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}