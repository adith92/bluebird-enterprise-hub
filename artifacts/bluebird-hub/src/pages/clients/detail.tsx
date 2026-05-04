import { Link, useParams } from "wouter";
import { useGetClient, getGetClientQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, MapPin, Mail, Phone, ReceiptText, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: client, isLoading } = useGetClient(Number(id), {
    query: { enabled: !!id, queryKey: getGetClientQueryKey(Number(id)) },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!client) return <div>Client not found</div>;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: client.name },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <Badge variant="outline" className="font-mono">
              {client.code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {client.industry} · Partner since {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex gap-4 items-center bg-muted/50 px-4 py-2 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Active Orders
            </p>
            <p className="text-xl font-bold">{client.activeOrders}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Lifetime Value
            </p>
            <p className="text-xl font-bold">{formatCurrency(client.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-2">Primary Contact</p>
              <div className="space-y-3">
                <p className="font-medium">{client.contactPerson}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${client.contactEmail}`} className="hover:text-primary truncate">
                    {client.contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${client.contactPhone}`} className="hover:text-primary">
                    {client.contactPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Billing Address</p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="leading-relaxed">{client.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="orders" className="w-full">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-muted-foreground" />
                  History
                </CardTitle>
                <TabsList>
                  <TabsTrigger value="orders">
                    Orders
                    {client.orders && client.orders.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {client.orders.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="invoices">
                    Invoices
                    {client.invoices && client.invoices.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {client.invoices.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="orders" className="m-0 border-none outline-none">
                {client.orders && client.orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Vehicle & Driver</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/sales/${order.id}`}
                              className="text-primary hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(order.startDate)}
                              <br />
                              <span className="text-muted-foreground text-xs">
                                to {formatDate(order.endDate)}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <Link
                                href={`/operations/vehicles/${order.vehicleId}`}
                                className="font-mono font-medium hover:underline"
                              >
                                {order.vehiclePlate}
                              </Link>
                              <Link
                                href={`/operations/drivers/${order.driverId}`}
                                className="text-muted-foreground hover:underline"
                              >
                                {order.driverName}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.price)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "active"
                                  ? "default"
                                  : order.status === "completed"
                                  ? "secondary"
                                  : order.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No order history for this client.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="m-0 border-none outline-none">
                {client.invoices && client.invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Order Ref</TableHead>
                        <TableHead>Issued / Due</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/finance/invoices/${invoice.id}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/sales/${invoice.orderId}`}
                              className="hover:underline text-sm"
                            >
                              {invoice.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span>{formatDate(invoice.issuedDate)}</span>
                              <span
                                className={
                                  new Date(invoice.dueDate) < new Date() &&
                                  invoice.status === "outstanding"
                                    ? "text-destructive text-xs font-medium"
                                    : "text-muted-foreground text-xs"
                                }
                              >
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
                              className={
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "text-amber-600 border-amber-200 bg-amber-50"
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No invoice history for this client.
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
