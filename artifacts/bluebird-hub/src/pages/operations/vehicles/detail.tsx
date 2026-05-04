import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetVehicle, useUpdateVehicleStatus, getGetVehicleQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Info, ReceiptText, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { UpdateVehicleStatusBodyStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const statusFormSchema = z
  .object({
    status: z.enum(["available", "booked", "maintenance"]),
    maintenanceCompletionDate: z.date().optional().nullable(),
    maintenanceNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "maintenance" && !data.maintenanceCompletionDate) return false;
      return true;
    },
    {
      message: "Maintenance completion date is required when status is Maintenance",
      path: ["maintenanceCompletionDate"],
    }
  );

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data: vehicle, isLoading } = useGetVehicle(Number(id), {
    query: { enabled: !!id, queryKey: getGetVehicleQueryKey(Number(id)) },
  });

  const updateStatus = useUpdateVehicleStatus();

  const form = useForm<z.infer<typeof statusFormSchema>>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: { status: "available", maintenanceNote: "" },
  });

  const selectedStatus = form.watch("status");

  const onSubmitStatus = async (values: z.infer<typeof statusFormSchema>) => {
    try {
      await updateStatus.mutateAsync({
        id: Number(id),
        data: {
          status: values.status as UpdateVehicleStatusBodyStatus,
          maintenanceCompletionDate:
            values.status === "maintenance" && values.maintenanceCompletionDate
              ? values.maintenanceCompletionDate.toISOString()
              : undefined,
          maintenanceNote:
            values.status === "maintenance" ? values.maintenanceNote : undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetVehicleQueryKey(Number(id)) });
      toast({ title: "Vehicle status updated" });
      setStatusDialogOpen(false);
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

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Fleet", href: "/operations" },
          { label: vehicle.plateNumber },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{vehicle.plateNumber}</h1>
            <Badge
              variant={
                vehicle.status === "available"
                  ? "secondary"
                  : vehicle.status === "booked"
                  ? "default"
                  : "outline"
              }
              className={
                vehicle.status === "available"
                  ? "bg-green-100 text-green-800"
                  : vehicle.status === "maintenance"
                  ? "bg-amber-100 text-amber-800 border-none"
                  : ""
              }
            >
              {vehicle.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicle.category} · {vehicle.model} ({vehicle.year})
          </p>
        </div>
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                form.reset({
                  status: vehicle.status as any,
                  maintenanceCompletionDate: vehicle.maintenanceCompletionDate
                    ? new Date(vehicle.maintenanceCompletionDate)
                    : undefined,
                  maintenanceNote: vehicle.maintenanceNote || "",
                });
              }}
            >
              Change Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Vehicle Status</DialogTitle>
              <DialogDescription>
                Change the availability status of {vehicle.plateNumber}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitStatus)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedStatus === "maintenance" && (
                  <>
                    <FormField
                      control={form.control}
                      name="maintenanceCompletionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            Expected Completion Date{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maintenanceNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Reason for maintenance..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setStatusDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateStatus.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {vehicle.status === "maintenance" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start text-amber-800">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <h4 className="font-semibold text-amber-900">Vehicle in Maintenance</h4>
            <p className="text-sm mt-1">
              Expected completion:{" "}
              <strong>{formatDate(vehicle.maintenanceCompletionDate)}</strong>
            </p>
            {vehicle.maintenanceNote && (
              <p className="text-sm mt-2 p-2 bg-amber-100/50 rounded italic">
                "{vehicle.maintenanceNote}"
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{vehicle.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                <p className="font-medium">{vehicle.capacity} pax</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Daily Rate</p>
                <p className="font-medium">{formatCurrency(vehicle.dailyRate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Added</p>
                <p className="font-medium">{formatDate(vehicle.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.orders && vehicle.orders.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.orders.map((order) => (
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
                No orders associated with this vehicle.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
