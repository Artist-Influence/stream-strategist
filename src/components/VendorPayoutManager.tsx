import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendorPayouts, useMarkPayoutPaid, useBulkMarkPayoutsPaid, VendorPayout } from '@/hooks/useVendorPayouts';
import { Search, Download, DollarSign, CheckCircle, Clock, Receipt } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

export function VendorPayoutManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  
  const { data: vendorPayouts, isLoading } = useVendorPayouts();
  const markPayoutPaid = useMarkPayoutPaid();
  const bulkMarkPayoutsPaid = useBulkMarkPayoutsPaid();
  const { toast } = useToast();

  // Flatten campaigns for table view and apply filters
  const allPayouts = vendorPayouts?.flatMap(vendor => 
    vendor.campaigns.map(campaign => ({
      ...campaign,
      vendor_total_owed: vendor.total_owed
    }))
  ) || [];

  const filteredPayouts = allPayouts.filter(payout => {
    const matchesSearch = payout.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const unpaidPayouts = filteredPayouts.filter(p => p.payment_status === 'unpaid');
  const totalUnpaidAmount = unpaidPayouts.reduce((sum, p) => sum + p.amount_owed, 0);
  const uniqueVendorsWithUnpaidCampaigns = new Set(unpaidPayouts.map(p => p.vendor_id)).size;

  const handleMarkPaid = (payout: VendorPayout) => {
    markPayoutPaid.mutate({
      campaignId: payout.campaign_id,
      vendorId: payout.vendor_id,
      amount: payout.amount_owed
    });
  };

  const handleSelectPayout = (payoutKey: string, checked: boolean) => {
    setSelectedPayouts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(payoutKey);
      } else {
        newSet.delete(payoutKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidKeys = unpaidPayouts.map(p => `${p.campaign_id}-${p.vendor_id}`);
      setSelectedPayouts(new Set(unpaidKeys));
    } else {
      setSelectedPayouts(new Set());
    }
  };

  const handleBulkMarkPaid = () => {
    const selectedUnpaidPayouts = unpaidPayouts.filter(p => 
      selectedPayouts.has(`${p.campaign_id}-${p.vendor_id}`)
    );

    if (selectedUnpaidPayouts.length === 0) {
      toast({
        title: "No Payouts Selected",
        description: "Please select unpaid campaigns to mark as paid.",
        variant: "destructive",
      });
      return;
    }

    const payoutData = selectedUnpaidPayouts.map(p => ({
      campaignId: p.campaign_id,
      vendorId: p.vendor_id,
      amount: p.amount_owed
    }));

    bulkMarkPayoutsPaid.mutate(payoutData);
    setSelectedPayouts(new Set());
  };

  const exportPayouts = () => {
    const csvData = filteredPayouts.map(payout => ({
      'Vendor': payout.vendor_name,
      'Campaign': payout.campaign_name,
      'Amount Owed': payout.amount_owed.toFixed(2),
      'Payment Status': payout.payment_status,
      'Allocated Streams': payout.allocated_streams.toLocaleString(),
      'Actual Streams': payout.actual_streams.toLocaleString(),
      'Cost Per Stream': payout.cost_per_stream.toFixed(4),
      'Campaign Completion': payout.campaign_completion_date || '',
      'Payment Date': payout.payment_date || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor-payouts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Vendor payouts exported successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vendor payouts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUnpaidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {unpaidPayouts.length} campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors Awaiting Payment</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVendorsWithUnpaidCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Unique vendors with unpaid campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected for Payout</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedPayouts.size}</div>
            <p className="text-xs text-muted-foreground">
              Campaigns ready for processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Payouts</CardTitle>
          <CardDescription>
            Manage vendor payments for completed campaigns. Select campaigns to process Friday payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors or campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'paid' | 'unpaid') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPayouts} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedPayouts.size > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedPayouts.size} campaigns selected
              </span>
              <Button 
                onClick={handleBulkMarkPaid} 
                disabled={bulkMarkPayoutsPaid.isPending}
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All as Paid
              </Button>
            </div>
          )}

          {/* Payouts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPayouts.size === unpaidPayouts.length && unpaidPayouts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount Owed</TableHead>
                  <TableHead>Streams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => {
                  const payoutKey = `${payout.campaign_id}-${payout.vendor_id}`;
                  const isSelected = selectedPayouts.has(payoutKey);
                  
                  return (
                    <TableRow key={payoutKey}>
                      <TableCell>
                        {payout.payment_status === 'unpaid' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectPayout(payoutKey, checked as boolean)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{payout.vendor_name}</TableCell>
                      <TableCell>{payout.campaign_name}</TableCell>
                      <TableCell>${payout.amount_owed.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{payout.actual_streams.toLocaleString()} actual</div>
                          <div className="text-muted-foreground text-xs">
                            {payout.allocated_streams.toLocaleString()} allocated
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payout.payment_status === 'paid' ? 'default' : 'outline'}>
                          {payout.payment_status === 'paid' ? (
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
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.campaign_completion_date}
                      </TableCell>
                      <TableCell>
                        {payout.payment_status === 'unpaid' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(payout)}
                            disabled={markPayoutPaid.isPending}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {payout.payment_status === 'paid' && payout.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Paid on {payout.payment_date}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredPayouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vendor payouts found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}