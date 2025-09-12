import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useVendorPaymentHistory } from "@/hooks/usePaymentHistory";
import { useVendors } from "@/hooks/useVendors";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Download, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function VendorPaymentHistoryPage() {
  const { user } = useAuth();
  const { data: vendors = [] } = useVendors();
  const [searchTerm, setSearchTerm] = useState("");

  // Find the vendor for the current user
  const userVendor = vendors.find(vendor => 
    vendor.vendor_users?.some(vu => vu.user_id === user?.id)
  );

  const { data: payments = [], isLoading } = useVendorPaymentHistory(userVendor?.id);

  const filteredPayments = payments.filter(payment =>
    (payment.campaign as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.campaign as any)?.track_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEarnings = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">Track your payment records and earnings</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payments
                  .filter(p => new Date(p.processed_at).getMonth() === new Date().getMonth())
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toFixed(2)
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.processed_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(payment.campaign as any)?.name || "Unknown Campaign"}
                    </TableCell>
                    <TableCell>{(payment.campaign as any)?.track_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">${Number(payment.amount).toFixed(2)}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.reference_number || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payment records found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}