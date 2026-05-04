import { Link, useParams } from "wouter";
import { useGetDriver, getGetDriverQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Info, ReceiptText, Star, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: driver, isLoading } = useGetDriver(Number(id), {
    query: { enabled: !!id, queryKey: getGetDriverQueryKey(Number(id)) },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!driver) return <div>Driver not found</div>;

  const statusLabel =
    driver.status === "on_trip"
      ? "On Trip"
      : driver.status === "off_duty"
      ? "Off Duty"
      : "Available";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Drivers", href: "/operations/drivers" },
          { label: driver.name },
        ]}
      />

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{driver.name}</h1>
          <Badge
            variant={
              driver.status === "available"
                ? "secondary"
                : driver.status === "on_trip"
                ? "default"
                : "outline"
            }
            className={
              driver.status === "available"
                ? "bg-green-100 text-green-800"
                : ""
            }
          >
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {driver.rating.toFixed(2)} rating · {driver.yearsOfService} years of service
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Driver Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </p>
              <p className="font-medium">{driver.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">License Number</p>
              <p className="font-mono font-medium">{driver.licenseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Joined</p>
              <p className="font-medium">{formatDate(driver.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
              Assigned Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.orders && driver.orders.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driver.orders.map((order) => (
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
                          <Link
                            href={`/clients/${order.clientId}`}
                            className="hover:underline"
                          >
                            {order.clientName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(order.startDate)} – {formatDate(order.endDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/operations/vehicles/${order.vehicleId}`}
                            className="hover:underline text-sm font-mono font-medium"
                          >
                            {order.vehiclePlate}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={order.status === "active" ? "default" : "outline"}
                            className={order.status === "completed" ? "bg-green-100 text-green-800" : ""}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                No orders assigned to this driver.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// suppress unused import warning
void Button;
