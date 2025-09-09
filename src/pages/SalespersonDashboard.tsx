import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Music, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaignSubmissions } from "@/hooks/useCampaignSubmissions";

export default function SalespersonDashboard() {
  const { user } = useAuth();
  const { data: submissions, isLoading } = useCampaignSubmissions();

  // Calculate stats from submissions
  const approvedSubmissions = submissions?.filter(s => s.status === 'approved') || [];
  const pendingSubmissions = submissions?.filter(s => s.status === 'pending_approval') || [];
  const totalRevenue = approvedSubmissions.reduce((sum, s) => sum + (s.price_paid || 0), 0);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Salesperson Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email?.split('@')[0]}
            </p>
          </div>
          <Button onClick={() => window.location.href = '/campaign-intake'}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Campaigns</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : approvedSubmissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${isLoading ? '...' : totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From approved campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : pendingSubmissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting operator review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Submissions</CardTitle>
            <CardDescription>
              Track the status of your submitted campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading submissions...
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{submission.campaign_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {submission.client_name} • ${submission.price_paid.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status === 'approved' && <CheckCircle className="h-3 w-3 inline mr-1" />}
                        {submission.status === 'rejected' && <XCircle className="h-3 w-3 inline mr-1" />}
                        {submission.status === 'pending_approval' && <Clock className="h-3 w-3 inline mr-1" />}
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
                {submissions.length > 5 && (
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/clients?tab=submissions'}>
                    View All {submissions.length} Submissions
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Submit your first campaign to get started
                </p>
                <Button onClick={() => window.location.href = '/campaign-intake'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}