import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Users } from "lucide-react";
import { useSalesGoals, useTeamGoals, useSalesPerformance } from "@/hooks/useSalesGoals";
import { useSalespeople } from "@/hooks/useSalespeople";
import { GoalSettingModal } from "@/components/GoalSettingModal";

export default function TeamGoalsPage() {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [modalType, setModalType] = useState<'individual' | 'team'>('individual');
  
  const { data: salesGoals = [] } = useSalesGoals();
  const { data: teamGoals = [] } = useTeamGoals();
  const { data: salesPerformance = [] } = useSalesPerformance();
  const { data: salespeople = [] } = useSalespeople();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeTeamGoals = teamGoals.filter(goal => 
    goal.goal_period_start <= currentMonth && goal.goal_period_end >= currentMonth
  );

  const activeSalesGoals = salesGoals.filter(goal => 
    goal.goal_period_start <= currentMonth && goal.goal_period_end >= currentMonth
  );

  const handleCreateGoal = (type: 'individual' | 'team') => {
    setModalType(type);
    setShowGoalModal(true);
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Goals & Performance</h1>
            <p className="text-muted-foreground">Set targets and track team performance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleCreateGoal('individual')}>
              <Plus className="h-4 w-4 mr-2" />
              Set Individual Goal
            </Button>
            <Button onClick={() => handleCreateGoal('team')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Set Team Goal
            </Button>
          </div>
        </div>

        {/* Team Goals Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTeamGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{goal.goal_name}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.current_value} / {goal.target_value}</span>
                  </div>
                  <Progress value={calculateProgress(goal.current_value, goal.target_value)} />
                  <Badge variant={goal.current_value >= goal.target_value ? "default" : "secondary"}>
                    {calculateProgress(goal.current_value, goal.target_value).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {activeTeamGoals.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No active team goals. Create your first team goal to start tracking progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Individual Salesperson Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Individual Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSalesGoals.map((goal) => {
                const performance = salesPerformance.find(p => 
                  p.salesperson_email === goal.salesperson_email &&
                  p.tracking_period_start <= currentMonth &&
                  p.tracking_period_end >= currentMonth
                );

                return (
                  <Card key={goal.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{goal.salesperson_email}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Revenue Goal */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Revenue</span>
                          <span>${performance?.actual_revenue || 0} / ${goal.revenue_target}</span>
                        </div>
                        <Progress value={calculateProgress(performance?.actual_revenue || 0, goal.revenue_target)} />
                      </div>

                      {/* Campaigns Goal */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Campaigns</span>
                          <span>{performance?.actual_campaigns || 0} / {goal.campaigns_target}</span>
                        </div>
                        <Progress value={calculateProgress(performance?.actual_campaigns || 0, goal.campaigns_target)} />
                      </div>

                      {/* Commission Goal */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Commission</span>
                          <span>${performance?.actual_commission || 0} / ${goal.commission_target}</span>
                        </div>
                        <Progress value={calculateProgress(performance?.actual_commission || 0, goal.commission_target)} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {activeSalesGoals.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No individual goals set for this period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${salesPerformance.reduce((sum, p) => sum + p.actual_revenue, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Salespeople</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salespeople.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goals Achieved</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSalesGoals.filter(goal => {
                  const performance = salesPerformance.find(p => 
                    p.salesperson_email === goal.salesperson_email
                  );
                  return performance && performance.actual_revenue >= goal.revenue_target;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSalesGoals.length > 0 
                  ? Math.round(
                      activeSalesGoals.reduce((sum, goal) => {
                        const performance = salesPerformance.find(p => 
                          p.salesperson_email === goal.salesperson_email
                        );
                        return sum + calculateProgress(performance?.actual_revenue || 0, goal.revenue_target);
                      }, 0) / activeSalesGoals.length
                    )
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        <GoalSettingModal 
          open={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          type={modalType}
        />
      </div>
    </Layout>
  );
}