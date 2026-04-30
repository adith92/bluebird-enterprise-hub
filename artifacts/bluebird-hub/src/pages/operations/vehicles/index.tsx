import { useState } from "react";
import { Link } from "wouter";
import { useListVehicles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListVehiclesStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function VehiclesList() {
  const [statusFilter, setStatusFilter] = useState<ListVehiclesStatus | "all">("all");
  
  const { data: vehicles, isLoading } = useListVehicles(
    statusFilter === "all" ? {} : { status: statusFilter }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-sm text-muted-foreground">Manage vehicles and track their availability status.</p>
        </div>
        {/* Placeholder for future add vehicle feature */}
        <Button variant="outline" disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All Vehicles</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="booked">Booked</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Model / Year</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
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
                ) : !vehicles || vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <Link href={`/operations/vehicles/${vehicle.id}`} className="text-primary hover:underline">
                          {vehicle.plateNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{vehicle.category}</TableCell>
                      <TableCell>
                        {vehicle.model} ({vehicle.year})
                      </TableCell>
                      <TableCell>{vehicle.capacity} pax</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(vehicle.dailyRate)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            vehicle.status === "available" ? "secondary" :
                            vehicle.status === "booked" ? "default" :
                            vehicle.status === "maintenance" ? "destructive" : "outline"
                          }
                          className={vehicle.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100" : vehicle.status === "maintenance" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100 border-none" : ""}
                        >
                          {vehicle.status}
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
