import { Link, useParams } from "wouter";
import { useGetOrder, useUpdateOrderStatus, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ChevronLeft, FileText, User, Car, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpdateOrderStatusBodyStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(Number(id), {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(Number(id)) }
  });

  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: UpdateOrderStatusBodyStatus) => {
    try {
      await updateStatus.mutateAsync({ id: Number(id), data: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(Number(id)) });
      toast({ title: "Status updated" });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!order) return <div>Order not found</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/sales">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
            <Badge 
              variant={
                order.status === "active" ? "default" :
                order.status === "completed" ? "secondary" :
                order.status === "cancelled" ? "destructive" : "outline"
              }
            >
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Created on {formatDateTime(order.createdAt)}</p>
        </div>
        <div>
          <Select 
            value={order.status} 
            onValueChange={(v) => handleStatusChange(v as UpdateOrderStatusBodyStatus)}
            disabled={updateStatus.isPending || order.status === "cancelled" || order.status === "completed"}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Client & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Client</p>
              <Link href={`/clients/${order.clientId}`} className="text-base font-medium text-primary hover:underline">
                {order.clientName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-base font-medium">{formatCurrency(order.price)}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              Fleet Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
              <Link href={`/operations/vehicles/${order.vehicleId}`} className="text-base font-medium text-primary hover:underline">
                {order.vehiclePlate}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Assigned Driver</p>
              <Link href={`/operations/drivers/${order.driverId}`} className="text-base font-medium text-primary hover:underline">
                {order.driverName}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/50 p-4 rounded-lg">
              <div className="flex-1 space-y-1 w-full text-center md:text-left">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">{formatDateTime(order.startDate)}</p>
                <p className="text-sm font-semibold">{order.pickupLocation}</p>
              </div>
              <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 space-y-1 w-full text-center md:text-right">
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-medium">{formatDateTime(order.endDate)}</p>
                <p className="text-sm font-semibold">{order.dropoffLocation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.invoice && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Related Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Link href={`/finance/invoices/${order.invoice.id}`} className="font-medium hover:underline flex items-center gap-2">
                    {order.invoice.invoiceNumber}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">Due on {formatDateTime(order.invoice.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium mb-1">{formatCurrency(order.invoice.amount)}</p>
                  <Badge variant={order.invoice.status === "paid" ? "secondary" : "outline"} className={order.invoice.status === "paid" ? "bg-green-100 text-green-800" : "text-amber-600 border-amber-200 bg-amber-50"}>
                    {order.invoice.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
