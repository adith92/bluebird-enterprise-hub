import { Link } from "wouter";
import { useListClients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function ClientsList() {
  const { data: clients, isLoading } = useListClients();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corporate Clients</h1>
          <p className="text-sm text-muted-foreground">Manage enterprise partners and billing accounts.</p>
        </div>
        <Button variant="outline" disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead className="text-right">Active Orders</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !clients || clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/50" />
                        <p>No clients found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <Link href={`/clients/${client.id}`} className="text-primary hover:underline">
                            {client.name}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">{client.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.industry}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{client.contactPerson}</span>
                          <span className="text-muted-foreground text-xs">{client.contactEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {client.activeOrders}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(client.totalRevenue)}
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
