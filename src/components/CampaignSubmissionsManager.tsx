import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Edit, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useCampaignSubmissions, useApproveCampaignSubmission, useRejectCampaignSubmission } from '@/hooks/useCampaignSubmissions';
import { useSubmissionsWithDrafts, useDraftCampaigns, useApproveDraftCampaign, useRejectDraftCampaign } from '@/hooks/useDraftCampaigns';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CampaignSubmissionsManagerProps {
  highlightSubmissionId?: string | null;
}

export function CampaignSubmissionsManager({ highlightSubmissionId }: CampaignSubmissionsManagerProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [draftRejectionReason, setDraftRejectionReason] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const highlightedCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: submissions = [], isLoading } = useCampaignSubmissions();
  const { data: submissionsWithDrafts = [], isLoading: isLoadingWithDrafts } = useSubmissionsWithDrafts();
  const { data: draftCampaigns = [], isLoading: isLoadingDrafts } = useDraftCampaigns();
  
  const approveMutation = useApproveCampaignSubmission();
  const rejectMutation = useRejectCampaignSubmission();
  const approveDraftMutation = useApproveDraftCampaign();
  const rejectDraftMutation = useRejectDraftCampaign();

  // Scroll to highlighted submission when it becomes available
  useEffect(() => {
    if (highlightSubmissionId && highlightedCardRef.current && !isLoading) {
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [highlightSubmissionId, isLoading, submissions]);

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

  const handleApproveDraft = async (campaignId: string) => {
    await approveDraftMutation.mutateAsync(campaignId);
  };

  const handleRejectDraft = async (campaignId: string) => {
    if (!draftRejectionReason.trim()) return;
    
    await rejectDraftMutation.mutateAsync({
      campaignId,
      reason: draftRejectionReason
    });
    
    setDraftRejectionReason('');
    setSelectedDraft(null);
  };

  const handleEditDraft = (campaignId: string) => {
    navigate(`/campaign-builder/${campaignId}`);
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

  const getCampaignStatusColor = (status: string, pendingReview?: boolean) => {
    if (pendingReview) return 'secondary';
    switch (status) {
      case 'draft': return 'secondary';
      case 'built': return 'default';
      case 'active': return 'default';
      default: return 'outline';
    }
  };

  const getCampaignStatusLabel = (status: string, pendingReview?: boolean) => {
    if (pendingReview) return 'Pending Review';
    switch (status) {
      case 'draft': return 'Draft';
      case 'built': return 'Built';
      case 'active': return 'Active';
      default: return status;
    }
  };

  if (isLoading || isLoadingWithDrafts || isLoadingDrafts) {
    return <div className="flex justify-center p-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Campaign Submissions</h2>
          <p className="text-muted-foreground">
            Manage campaign submissions and draft campaigns workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {submissions.filter(s => s.status === 'pending_approval').length} Pending Review
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Review ({submissions.filter(s => s.status === 'pending_approval').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <div className="grid gap-4">
        {submissions.map((submission) => {
          const isHighlighted = highlightSubmissionId === submission.id;
          return (
          <Card 
            key={submission.id} 
            ref={isHighlighted ? highlightedCardRef : null}
            className={`hover:shadow-lg transition-all duration-300 ${
              isHighlighted 
                ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
                : ''
            }`}
          >
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
                     onClick={() => navigate(`/campaign-builder/review/${submission.id}`)}
                     size="sm"
                     className="bg-primary hover:bg-primary/90"
                   >
                     Review & Approve
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
        );
        })}

            {submissions.filter(s => s.status === 'pending_approval').length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No pending submissions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="grid gap-4">
            {submissionsWithDrafts
              .filter(s => s.status === 'approved')
              .map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{submission.campaign_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Client: {submission.client_name} • Approved {formatDistanceToNow(new Date(submission.approved_at || submission.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">Approved</Badge>
                        {submission.campaign && submission.campaign[0] && (
                          <Badge variant={getCampaignStatusColor(submission.campaign[0].status, submission.campaign[0].pending_operator_review) as any}>
                            {getCampaignStatusLabel(submission.campaign[0].status, submission.campaign[0].pending_operator_review)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        <span className="font-medium">Salesperson:</span>
                        <div>{submission.salesperson}</div>
                      </div>
                    </div>

                    {submission.campaign && submission.campaign[0] && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/campaign-history?highlight=${submission.campaign[0].id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Campaign
                        </Button>
                        {submission.campaign[0].pending_operator_review && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDraft(submission.campaign[0].id)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Draft
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

            {submissionsWithDrafts.filter(s => s.status === 'approved').length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No approved submissions yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <div className="grid gap-4">
            {draftCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Client: {campaign.client_name} • Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Budget:</span>
                      <div>${campaign.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Stream Goal:</span>
                      <div>{campaign.stream_goal.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Start Date:</span>
                      <div>{new Date(campaign.start_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Salesperson:</span>
                      <div>{campaign.salesperson}</div>
                    </div>
                  </div>

                  {campaign.algorithm_recommendations && 
                   typeof campaign.algorithm_recommendations === 'object' && 
                   (campaign.algorithm_recommendations as any)?.rejection_reason && (
                    <div className="text-sm p-3 bg-destructive/10 rounded-md">
                      <span className="font-medium text-destructive">Previous Rejection:</span>
                      <div className="text-destructive/80">{(campaign.algorithm_recommendations as any).rejection_reason}</div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApproveDraft(campaign.id)}
                      disabled={approveDraftMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {approveDraftMutation.isPending ? 'Approving...' : 'Approve & Build'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDraft(campaign.id)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Draft
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDraft(campaign.id)}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Draft Campaign</DialogTitle>
                          <DialogDescription>
                            Please provide feedback for "{campaign.name}" to help improve the draft.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          <Textarea
                            value={draftRejectionReason}
                            onChange={(e) => setDraftRejectionReason(e.target.value)}
                            placeholder="Please explain what needs to be improved..."
                            rows={3}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDraftRejectionReason('');
                              setSelectedDraft(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectDraft(campaign.id)}
                            disabled={!draftRejectionReason.trim() || rejectDraftMutation.isPending}
                          >
                            {rejectDraftMutation.isPending ? 'Sending Back...' : 'Send Back for Revision'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}

            {draftCampaigns.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No draft campaigns pending review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}