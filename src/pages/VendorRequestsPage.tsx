import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Music, Calendar, DollarSign } from "lucide-react";

export default function VendorRequestsPage() {
  // Mock data for campaign requests
  const mockRequests = [
    {
      id: 1,
      campaignName: "Summer Vibes 2024",
      clientName: "Atlantic Records", 
      trackName: "Beach Party",
      requestedPlaylists: ["Chill Vibes", "Summer Hits"],
      budget: 5000,
      startDate: "2024-03-15",
      duration: "30 days",
      status: "pending",
      genres: ["Pop", "Electronic"],
      expectedStreams: 75000
    },
    {
      id: 2,
      campaignName: "Indie Rock Promotion",
      clientName: "Independent Artist",
      trackName: "City Lights",
      requestedPlaylists: ["Indie Discoveries"],
      budget: 2500,
      startDate: "2024-03-20",
      duration: "21 days", 
      status: "pending",
      genres: ["Indie", "Rock"],
      expectedStreams: 45000
    }
  ];

  const handleApprove = (requestId: number) => {
    console.log('Approving request:', requestId);
    // Implementation for approving request
  };

  const handleReject = (requestId: number) => {
    console.log('Rejecting request:', requestId);
    // Implementation for rejecting request
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Requests</h1>
            <p className="text-muted-foreground">
              Review and approve campaign participation requests for your playlists
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockRequests.filter(r => r.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your decision
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${mockRequests.reduce((sum, r) => sum + r.budget, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From pending requests
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Streams</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockRequests.reduce((sum, r) => sum + r.expectedStreams, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests</h2>
          
          {mockRequests.length > 0 ? (
            mockRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.campaignName}</CardTitle>
                      <CardDescription>
                        {request.clientName} • {request.trackName}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">${request.budget.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.startDate}</div>
                        <div className="text-xs text-muted-foreground">{request.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.expectedStreams.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Expected streams</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Playlists</div>
                      <div className="text-xs text-muted-foreground">
                        {request.requestedPlaylists.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {request.genres.map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleReject(request.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button onClick={() => handleApprove(request.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No pending requests</h3>
                <p className="text-muted-foreground">
                  You don't have any campaign participation requests at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}