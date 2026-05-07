import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListInvoicesStatus } from "@workspace/api-client-react";
import { ReceiptText } from "lucide-react";

export default function InvoicesList() {
  const [statusFilter, setStatusFilter] = useState<ListInvoicesStatus | "all">("all");
  
  const { data: invoices, isLoading } = useListInvoices(
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Invoicing</h1>
          <p className="text-sm text-muted-foreground">Manage client invoices and track payments.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order Ref</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued / Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : safeInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ReceiptText className="h-8 w-8 text-muted-foreground/50" />
                        <p>No invoices found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  safeInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/finance/invoices/${invoice.id}`} className="text-primary hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/sales/${invoice.orderId}`} className="hover:underline text-sm">
                          {invoice.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${invoice.clientId}`} className="hover:underline">
                          {invoice.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{formatDate(invoice.issuedDate)}</span>
                          <span className={new Date(invoice.dueDate) < new Date() && invoice.status === 'outstanding' ? "text-destructive text-xs font-medium" : "text-muted-foreground text-xs"}>
                            Due {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={invoice.status === "paid" ? "secondary" : "outline"}
                          className={invoice.status === "paid" ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100" : "text-amber-600 border-amber-200 bg-amber-50"}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
