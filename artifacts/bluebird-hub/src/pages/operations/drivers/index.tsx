import { Link } from "wouter";
import { useListDrivers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Star } from "lucide-react";

export default function DriversList() {
  const { data: drivers, isLoading } = useListDrivers();
  const safeDrivers = Array.isArray(drivers) ? drivers : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Roster</h1>
          <p className="text-sm text-muted-foreground">Manage drivers, their status, and assignments.</p>
        </div>
        <Button variant="outline" disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Experience</TableHead>
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
                ) : safeDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No drivers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <Link href={`/operations/drivers/${driver.id}`} className="text-primary hover:underline">
                          {driver.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{driver.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{driver.yearsOfService} years</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            driver.status === "available" ? "secondary" :
                            driver.status === "on_trip" ? "default" :
                            driver.status === "off_duty" ? "outline" : "outline"
                          }
                          className={driver.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100" : ""}
                        >
                          {driver.status === "on_trip" ? "On Trip" : driver.status === "off_duty" ? "Off Duty" : "Available"}
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
