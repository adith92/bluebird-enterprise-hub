import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const formSchema = z.object({
  name:          z.string().min(1, "Company name is required"),
  code:          z.string().min(1, "Client code is required").regex(/^[A-Z0-9-]+$/, "Use uppercase letters, numbers, and hyphens only"),
  industry:      z.string().min(1, "Industry is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactEmail:  z.string().email("Invalid email address"),
  contactPhone:  z.string().min(1, "Phone number is required"),
  address:       z.string().min(1, "Address is required"),
});

const INDUSTRY_OPTIONS = [
  "Automotive",
  "Banking & Finance",
  "Construction",
  "Energy & Mining",
  "Government",
  "Healthcare",
  "Hospitality",
  "Manufacturing",
  "Retail",
  "Technology",
  "Telecommunications",
  "Other",
];

export default function CreateClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createClient = useCreateClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      industry: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const client = await createClient.mutateAsync({ data: values });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      toast({ title: "Client created successfully" });
      setLocation(`/clients/${client.id}`);
    } catch {
      toast({
        title: "Failed to create client",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: "New Client" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Client</h1>
        <p className="text-sm text-muted-foreground">Add a new corporate partner to the system.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Fill in the details of the new corporate client.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PT. Astra International" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. AST-001"
                          className="font-mono uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input
                          list="industry-options"
                          placeholder="e.g. Automotive"
                          {...field}
                        />
                      </FormControl>
                      <datalist id="industry-options">
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Budi Santoso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +62 21 5555 1001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="e.g. contact@company.co.id"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jl. Sudirman No. 1, Jakarta Pusat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 border-t pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setLocation("/clients")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
