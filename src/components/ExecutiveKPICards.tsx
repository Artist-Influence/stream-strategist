import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutiveDashboardData } from "@/hooks/useExecutiveDashboardData";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Users } from "lucide-react";

interface ExecutiveKPICardsProps {
  data: ExecutiveDashboardData;
}

export const ExecutiveKPICards = ({ data }: ExecutiveKPICardsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {getTrendIcon(data.monthOverMonthGrowth.revenue)}
            <span className={`ml-1 ${getTrendColor(data.monthOverMonthGrowth.revenue)}`}>
              {data.monthOverMonthGrowth.revenue >= 0 ? '+' : ''}{data.monthOverMonthGrowth.revenue.toFixed(1)}% from last month
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalCampaigns}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(data.monthOverMonthGrowth.campaigns)}
              <span className={`ml-1 ${getTrendColor(data.monthOverMonthGrowth.campaigns)}`}>
                {data.monthOverMonthGrowth.campaigns >= 0 ? '+' : ''}{data.monthOverMonthGrowth.campaigns.toFixed(1)}% MoM
              </span>
            </p>
            <Badge variant="secondary" className="text-xs">
              {data.activeCampaigns} active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stream Performance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.totalActualStreams)}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              of {formatNumber(data.totalStreamGoals)} goal
            </p>
            <Badge 
              variant={data.goalCompletionRate >= 80 ? "default" : data.goalCompletionRate >= 60 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {data.goalCompletionRate.toFixed(1)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={data.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.averageROI >= 0 ? '+' : ''}{data.averageROI.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Industry avg: {data.performanceBenchmarks.industryAvgROI}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};