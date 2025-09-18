import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorPaymentData, useUpdateVendorCampaignRate } from "@/hooks/useVendorPayments";
import { DollarSign, CheckCircle, Clock, Edit, Save, X, Search } from "lucide-react";

export function VendorPaymentSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [editingRates, setEditingRates] = useState<Map<string, number>>(new Map());
  const [pendingRates, setPendingRates] = useState<Map<string, number>>(new Map());

  const { data: payments = [], isLoading } = useVendorPaymentData();
  const updateRate = useUpdateVendorCampaignRate();

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.track_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const totalUnpaid = payments
    .filter(p => p.payment_status === "unpaid")
    .reduce((sum, p) => sum + p.amount_owed, 0);
  const unpaidCount = payments.filter(p => p.payment_status === "unpaid").length;
  const totalEarned = payments
    .filter(p => p.payment_status === "paid")
    .reduce((sum, p) => sum + p.amount_owed, 0);

  const handleEditRate = (campaignId: string, currentRate: number) => {
    setEditingRates(prev => new Map(prev).set(campaignId, currentRate));
    setPendingRates(prev => new Map(prev).set(campaignId, currentRate));
  };

  const handleSaveRate = (campaignId: string) => {
    const newRate = pendingRates.get(campaignId);
    if (newRate !== undefined && newRate > 0) {
      updateRate.mutate({ campaignId, newRatePer1k: newRate });
    }
    
    setEditingRates(prev => {
      const newMap = new Map(prev);
      newMap.delete(campaignId);
      return newMap;
    });
    setPendingRates(prev => {
      const newMap = new Map(prev);
      newMap.delete(campaignId);
      return newMap;
    });
  };

  const handleCancelEdit = (campaignId: string) => {
    setEditingRates(prev => {
      const newMap = new Map(prev);
      newMap.delete(campaignId);
      return newMap;
    });
    setPendingRates(prev => {
      const newMap = new Map(prev);
      newMap.delete(campaignId);
      return newMap;
    });
  };

  const handleRateChange = (campaignId: string, value: string) => {
    const rate = parseFloat(value) || 0;
    setPendingRates(prev => new Map(prev).set(campaignId, rate));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading payment data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Unpaid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUnpaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidCount} campaigns pending payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From completed campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              All time campaign participation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Payments & Rates</CardTitle>
          <CardDescription>
            View your campaign payments and adjust your rates per campaign. Rate changes affect all campaign cost calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns or tracks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | "paid" | "unpaid") => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Streams</TableHead>
                  <TableHead>Rate ($/1k)</TableHead>
                  <TableHead>Amount Owed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {payments.length === 0 ? "No campaigns found" : "No campaigns match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const isEditing = editingRates.has(payment.campaign_id);
                    const pendingRate = pendingRates.get(payment.campaign_id);
                    
                    return (
                      <TableRow key={payment.campaign_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.campaign_name}</div>
                            {payment.track_name && (
                              <div className="text-sm text-muted-foreground">{payment.track_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{payment.actual_streams.toLocaleString()}</div>
                            <div className="text-muted-foreground">
                              of {payment.allocated_streams.toLocaleString()} allocated
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pendingRate}
                                onChange={(e) => handleRateChange(payment.campaign_id, e.target.value)}
                                className="w-20"
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveRate(payment.campaign_id)}
                                  disabled={updateRate.isPending}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelEdit(payment.campaign_id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>${payment.current_rate_per_1k.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRate(payment.campaign_id, payment.current_rate_per_1k)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${payment.amount_owed.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.payment_status === "paid" ? "default" : "outline"}
                          >
                            {payment.payment_status === "paid" ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Unpaid
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {payment.payment_date ? (
                              <div>Paid: {new Date(payment.payment_date).toLocaleDateString()}</div>
                            ) : (
                              <div>Due: {payment.campaign_completion_date ? new Date(payment.campaign_completion_date).toLocaleDateString() : 'TBD'}</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}