import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, List, CheckCircle, XCircle, Music, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyVendor } from "@/hooks/useVendors";
import { useMyPlaylists } from "@/hooks/useVendorPlaylists";
import { useVendorCampaignRequests } from "@/hooks/useVendorCampaignRequests";

export default function VendorDashboard() {
  const { user } = useAuth();
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useMyVendor();
  const { data: playlists, isLoading: playlistsLoading, error: playlistsError } = useMyPlaylists();
  const { data: requests = [] } = useVendorCampaignRequests();

  const totalStreams = playlists?.reduce((sum, playlist) => sum + playlist.avg_daily_streams, 0) || 0;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  if (vendorLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (vendorError || !vendor) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-destructive mb-4">No Vendor Association Found</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not associated with any vendor. Please contact an administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              Error: {vendorError?.message || 'No vendor data found'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Portal</h1>
            <p className="text-muted-foreground">
              {vendor ? `${vendor.name} - Manage your playlists and campaigns` : 'Manage your playlists and campaign participation'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Playlists</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlistsLoading ? '...' : playlists?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active playlists
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Streams</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlistsLoading ? '...' : totalStreams.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total across all playlists
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/vendor/requests'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Playlist Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle>Recent Playlists</CardTitle>
              <CardDescription>
                Your active playlists available for campaigns
              </CardDescription>
            </div>
            <Button onClick={() => window.location.href = '/vendor/playlists'} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Playlist
            </Button>
          </CardHeader>
          <CardContent>
            {playlistsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading playlists...
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="space-y-3">
                <ScrollArea className="h-60">
                  <div className="space-y-3 pr-3">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{playlist.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {playlist.avg_daily_streams.toLocaleString()} daily streams
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {playlist.follower_count?.toLocaleString() || '0'} followers
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/vendor/playlists'}>
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/vendor/playlists'}>
                  View All {playlists.length} Playlists
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first playlist to start participating in campaigns
                </p>
                <Button onClick={() => window.location.href = '/vendor/playlists'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Playlist
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Participation Requests</CardTitle>
            <CardDescription>
              Review and approve/deny campaign participation requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{request.campaign?.name || 'Campaign Request'}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.playlists?.length || 0} playlists • {request.status}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/vendor/requests'}>
                      {request.status === 'pending' ? 'Review' : 'View'}
                    </Button>
                  </div>
                ))}
                {requests.length > 3 && (
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/vendor/requests'}>
                    View All {requests.length} Requests
                  </Button>
                )}
                {requests.length <= 3 && requests.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/vendor/requests'}>
                    Manage Requests
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground">
                  Campaign participation requests will appear here when available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}