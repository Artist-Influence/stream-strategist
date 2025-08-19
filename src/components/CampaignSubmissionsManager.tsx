import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCampaignSubmissions, useApproveCampaignSubmission, useRejectCampaignSubmission } from '@/hooks/useCampaignSubmissions';
import { formatDistanceToNow } from 'date-fns';

export function CampaignSubmissionsManager() {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: submissions = [], isLoading } = useCampaignSubmissions();
  const approveMutation = useApproveCampaignSubmission();
  const rejectMutation = useRejectCampaignSubmission();

  const handleApprove = async (submissionId: string) => {
    await approveMutation.mutateAsync(submissionId);
  };

  const handleReject = async (submissionId: string) => {
    if (!rejectionReason.trim()) return;
    
    await rejectMutation.mutateAsync({
      submissionId,
      reason: rejectionReason
    });
    
    setRejectionReason('');
    setSelectedSubmission(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'default';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Campaign Submissions</h2>
          <p className="text-muted-foreground">
            Review and approve campaign submissions from salespeople
          </p>
        </div>
        <Badge variant="outline">
          {submissions.filter(s => s.status === 'pending_approval').length} Pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{submission.campaign_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Client: {submission.client_name} • Salesperson: {submission.salesperson}
                  </p>
                </div>
                <Badge variant={getStatusColor(submission.status) as any}>
                  {getStatusLabel(submission.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campaign Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Budget:</span>
                  <div>${submission.price_paid.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">Stream Goal:</span>
                  <div>{submission.stream_goal.toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">Start Date:</span>
                  <div>{new Date(submission.start_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>
                  <div>{formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</div>
                </div>
              </div>

              {/* Client Emails */}
              <div className="text-sm">
                <span className="font-medium">Client Emails:</span>
                <div className="text-muted-foreground">
                  {submission.client_emails.join(', ')}
                </div>
              </div>

              {/* Track URL */}
              <div className="text-sm">
                <span className="font-medium">Track URL:</span>
                <div className="text-muted-foreground break-all">
                  <a 
                    href={submission.track_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {submission.track_url}
                  </a>
                </div>
              </div>

              {/* Notes */}
              {submission.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span>
                  <div className="text-muted-foreground">{submission.notes}</div>
                </div>
              )}

              {/* Rejection Reason */}
              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className="text-sm p-3 bg-destructive/10 rounded-md">
                  <span className="font-medium text-destructive">Rejection Reason:</span>
                  <div className="text-destructive/80">{submission.rejection_reason}</div>
                </div>
              )}

              {/* Action Buttons */}
              {submission.status === 'pending_approval' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(submission.id)}
                    disabled={approveMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve & Create Campaign'}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission.id)}
                      >
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Campaign Submission</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting "{submission.campaign_name}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>Rejection Reason</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please explain why this campaign is being rejected..."
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRejectionReason('');
                            setSelectedSubmission(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(submission.id)}
                          disabled={!rejectionReason.trim() || rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? 'Rejecting...' : 'Reject Campaign'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {submissions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No campaign submissions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}