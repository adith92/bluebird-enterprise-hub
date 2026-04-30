import type {
  Client,
  Vehicle,
  Driver,
  Order,
  Invoice,
} from "@workspace/db";

export type ApiClient = {
  id: number;
  name: string;
  code: string;
  industry: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  activeOrders: number;
  totalRevenue: number;
  createdAt: string;
};

export type ApiVehicle = {
  id: number;
  plateNumber: string;
  category: string;
  model: string;
  year: number;
  capacity: number;
  status: "available" | "booked" | "maintenance";
  maintenanceCompletionDate: string | null;
  maintenanceNote: string | null;
  dailyRate: number;
  createdAt: string;
};

export type ApiDriver = {
  id: number;
  name: string;
  licenseNumber: string;
  phone: string;
  status: "available" | "on_trip" | "off_duty";
  rating: number;
  yearsOfService: number;
  createdAt: string;
};

export type ApiOrder = {
  id: number;
  orderNumber: string;
  clientId: number;
  clientName: string;
  vehicleId: number;
  vehiclePlate: string;
  driverId: number;
  driverName: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  price: number;
  status: "draft" | "active" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
};

export type ApiInvoice = {
  id: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  clientId: number;
  clientName: string;
  amount: number;
  status: "paid" | "outstanding";
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
};

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

const toIso = (d: Date | string): string => {
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
};

export function serializeClient(
  c: Client,
  activeOrders: number,
  totalRevenue: number,
): ApiClient {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    industry: c.industry,
    contactPerson: c.contactPerson,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    address: c.address,
    activeOrders,
    totalRevenue,
    createdAt: toIso(c.createdAt),
  };
}

export function serializeVehicle(v: Vehicle): ApiVehicle {
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    category: v.category,
    model: v.model,
    year: v.year,
    capacity: v.capacity,
    status: v.status as ApiVehicle["status"],
    maintenanceCompletionDate: v.maintenanceCompletionDate ?? null,
    maintenanceNote: v.maintenanceNote ?? null,
    dailyRate: num(v.dailyRate),
    createdAt: toIso(v.createdAt),
  };
}

export function serializeDriver(d: Driver): ApiDriver {
  return {
    id: d.id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    phone: d.phone,
    status: d.status as ApiDriver["status"],
    rating: num(d.rating),
    yearsOfService: d.yearsOfService,
    createdAt: toIso(d.createdAt),
  };
}

export function serializeOrder(
  o: Order,
  clientName: string,
  vehiclePlate: string,
  driverName: string,
): ApiOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    clientId: o.clientId,
    clientName,
    vehicleId: o.vehicleId,
    vehiclePlate,
    driverId: o.driverId,
    driverName,
    startDate: o.startDate,
    endDate: o.endDate,
    pickupLocation: o.pickupLocation,
    dropoffLocation: o.dropoffLocation,
    price: num(o.price),
    status: o.status as ApiOrder["status"],
    notes: o.notes ?? null,
    createdAt: toIso(o.createdAt),
  };
}

export function serializeInvoice(
  inv: Invoice,
  orderNumber: string,
  clientId: number,
  clientName: string,
): ApiInvoice {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderId: inv.orderId,
    orderNumber,
    clientId,
    clientName,
    amount: num(inv.amount),
    status: inv.status as ApiInvoice["status"],
    issuedDate: inv.issuedDate,
    dueDate: inv.dueDate,
    paidDate: inv.paidDate ?? null,
  };
}
