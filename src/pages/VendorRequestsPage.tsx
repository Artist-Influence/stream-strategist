import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVendorCampaignRequests, useRespondToVendorRequest } from '@/hooks/useVendorCampaignRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Clock, Music, Calendar, DollarSign } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function VendorRequestsPage() {
  const { data: requests = [], isLoading } = useVendorCampaignRequests();
  const respondToRequest = useRespondToVendorRequest();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseType, setResponseType] = useState<'approved' | 'rejected'>('approved');

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const totalRevenue = pendingRequests.reduce((sum, req) => sum + (req.campaign?.budget || 0), 0);
  const totalStreams = pendingRequests.reduce((sum, req) => sum + (req.campaign?.stream_goal || 0), 0);

  const handleRespond = async (requestId: string, status: 'approved' | 'rejected') => {
    setSelectedRequest(requestId);
    setResponseType(status);
    setResponseNotes('');
    setDialogOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedRequest) return;

    await respondToRequest.mutateAsync({
      requestId: selectedRequest,
      status: responseType,
      response_notes: responseNotes.trim() || undefined,
    });

    setDialogOpen(false);
    setSelectedRequest(null);
    setResponseNotes('');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
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
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
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
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
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
              <div className="text-2xl font-bold">{totalStreams.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Campaign Requests</h2>
          
          {requests.length > 0 ? (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.campaign?.name || 'Untitled Campaign'}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {request.campaign?.brand_name} • {request.campaign?.track_name || 'Track'}
                      </p>
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
                        <div className="text-sm font-medium">{formatCurrency(request.campaign?.budget || 0)}</div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.campaign?.start_date || 'TBD'}</div>
                        <div className="text-xs text-muted-foreground">{request.campaign?.duration_days || 0} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{(request.campaign?.stream_goal || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Expected streams</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Playlists</div>
                      <div className="text-xs text-muted-foreground">
                        {request.playlists?.map(p => p.name).join(', ') || 'No playlists'}
                      </div>
                    </div>
                  </div>

                  {request.playlists && request.playlists.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Requested Playlists</p>
                      <div className="flex flex-wrap gap-2">
                        {request.playlists.map((playlist) => (
                          <Badge key={playlist.id} variant="outline">
                            {playlist.name} ({playlist.avg_daily_streams.toLocaleString()} streams/day)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.campaign?.music_genres && request.campaign.music_genres.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap gap-1">
                        {request.campaign.music_genres.map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.response_notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Response Notes</p>
                      <p className="text-sm bg-muted p-2 rounded">{request.response_notes}</p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => handleRespond(request.id, 'rejected')}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button onClick={() => handleRespond(request.id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No campaign requests</h3>
                <p className="text-muted-foreground">
                  You don't have any campaign participation requests at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Response Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {responseType === 'approved' ? 'Approve Campaign Request' : 'Reject Campaign Request'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="response-notes">Notes (optional)</Label>
                <Textarea
                  id="response-notes"
                  placeholder={
                    responseType === 'approved' 
                      ? "Add any notes about this approval..." 
                      : "Please provide a reason for rejection..."
                  }
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitResponse}
                  disabled={respondToRequest.isPending}
                  className={responseType === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {respondToRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {responseType === 'approved' ? 'Approve' : 'Reject'} Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}