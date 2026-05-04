import { Link, useParams } from "wouter";
import {
  useGetInvoice,
  useUpdateInvoiceStatus,
  getGetInvoiceQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReceiptText, Building2, Calendar, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useGetInvoice(Number(id), {
    query: { enabled: !!id, queryKey: getGetInvoiceQueryKey(Number(id)) },
  });

  const updateStatus = useUpdateInvoiceStatus();

  const handleMarkAsPaid = async () => {
    try {
      await updateStatus.mutateAsync({ id: Number(id), data: { status: "paid" } });
      queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(Number(id)) });
      toast({ title: "Invoice marked as paid" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!invoice) return <div>Invoice not found</div>;

  const isOverdue =
    invoice.status === "outstanding" && new Date(invoice.dueDate) < new Date();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Finance", href: "/finance" },
          { label: invoice.invoiceNumber },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <Badge
              variant={
                invoice.status === "paid"
                  ? "secondary"
                  : isOverdue
                  ? "destructive"
                  : "outline"
              }
              className={
                invoice.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : invoice.status === "outstanding" && !isOverdue
                  ? "text-amber-600 border-amber-200 bg-amber-50"
                  : ""
              }
            >
              {isOverdue ? "Overdue" : invoice.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            For order{" "}
            <Link href={`/sales/${invoice.orderId}`} className="text-primary hover:underline">
              {invoice.orderNumber}
            </Link>
          </p>
        </div>
        {invoice.status === "outstanding" && (
          <Button onClick={handleMarkAsPaid} disabled={updateStatus.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Billed To</p>
                <Link
                  href={`/clients/${invoice.clientId}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {invoice.clientName}
                </Link>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Amount
                </p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Issued Date
                </p>
                <p className="font-medium">{formatDate(invoice.issuedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Due Date
                </p>
                <p className={isOverdue ? "font-bold text-destructive" : "font-medium"}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              {invoice.paidDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" /> Paid Date
                  </p>
                  <p className="font-medium text-green-700">
                    {formatDate(invoice.paidDate)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Order Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <Link
                href={`/sales/${invoice.orderId}`}
                className="text-base font-medium text-primary hover:underline"
              >
                {invoice.orderNumber}
              </Link>
            </div>
            {invoice.order && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Service Period</p>
                  <p className="text-sm">
                    {formatDate(invoice.order.startDate)} – {formatDate(invoice.order.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <Link
                    href={`/operations/vehicles/${invoice.order.vehicleId}`}
                    className="text-sm hover:underline font-mono font-medium text-primary"
                  >
                    {invoice.order.vehiclePlate}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Driver</p>
                  <Link
                    href={`/operations/drivers/${invoice.order.driverId}`}
                    className="text-sm hover:underline text-primary"
                  >
                    {invoice.order.driverName}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                  <Badge variant="outline">{invoice.order.status}</Badge>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/sales/${invoice.orderId}`}>View Full Order</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
