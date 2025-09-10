import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useSalespersonCommissionStats } from "@/hooks/useSalespersonCampaigns";

export function SalespersonCommissionCard() {
  const { data: stats, isLoading } = useSalespersonCommissionStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading commission data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Commission Tracking
        </CardTitle>
        <CardDescription>
          Your sales performance and commission breakdown (20% of gross sales)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved Commission
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${(stats?.approvedCommission || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              From {stats?.approvedCampaigns || 0} campaigns
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending Commission
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              ${(stats?.pendingCommission || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              From {stats?.pendingCampaigns || 0} campaigns
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Commission
            </div>
            <div className="text-2xl font-bold">
              ${(stats?.totalCommission || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              From {stats?.totalCampaigns || 0} total campaigns
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}