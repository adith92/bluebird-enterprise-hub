import {
  db,
  clientsTable,
  vehiclesTable,
  driversTable,
  ordersTable,
  invoicesTable,
} from "@workspace/db";

async function clear() {
  await db.delete(invoicesTable);
  await db.delete(ordersTable);
  await db.delete(driversTable);
  await db.delete(vehiclesTable);
  await db.delete(clientsTable);
}

async function seed() {
  await clear();

  // Clients
  const clients = await db
    .insert(clientsTable)
    .values([
      {
        name: "PT. Astra International",
        code: "AST-001",
        industry: "Automotive",
        contactPerson: "Budi Santoso",
        contactEmail: "budi.s@astra.co.id",
        contactPhone: "+62 21 5555 1001",
        address: "Sunter II, Jakarta Utara",
      },
      {
        name: "PT. Telkom Indonesia",
        code: "TLK-002",
        industry: "Telecommunications",
        contactPerson: "Siti Rahayu",
        contactEmail: "s.rahayu@telkom.co.id",
        contactPhone: "+62 22 5555 1002",
        address: "Jl. Japati No.1, Bandung",
      },
      {
        name: "PT. Bank Mandiri",
        code: "MNR-003",
        industry: "Banking & Finance",
        contactPerson: "Ahmad Wijaya",
        contactEmail: "a.wijaya@bankmandiri.co.id",
        contactPhone: "+62 21 5555 1003",
        address: "Plaza Mandiri, Jl. Gatot Subroto, Jakarta",
      },
      {
        name: "PT. Pertamina",
        code: "PTM-004",
        industry: "Energy",
        contactPerson: "Dewi Lestari",
        contactEmail: "dewi.l@pertamina.com",
        contactPhone: "+62 21 5555 1004",
        address: "Jl. Medan Merdeka Timur 1A, Jakarta",
      },
      {
        name: "PT. Unilever Indonesia",
        code: "UVL-005",
        industry: "Consumer Goods",
        contactPerson: "Rizky Pratama",
        contactEmail: "r.pratama@unilever.co.id",
        contactPhone: "+62 21 5555 1005",
        address: "BSD Green Office Park, Tangerang",
      },
    ])
    .returning();

  // Vehicles
  const vehicles = await db
    .insert(vehiclesTable)
    .values([
      // Goldenbird Sedans (premium executive)
      { plateNumber: "B 1001 GBS", category: "Goldenbird Sedan", model: "Toyota Camry", year: 2023, capacity: 4, status: "available", dailyRate: "1500000" },
      { plateNumber: "B 1002 GBS", category: "Goldenbird Sedan", model: "Toyota Camry", year: 2023, capacity: 4, status: "available", dailyRate: "1500000" },
      { plateNumber: "B 1003 GBS", category: "Goldenbird Sedan", model: "Mercedes-Benz E-Class", year: 2024, capacity: 4, status: "booked", dailyRate: "2800000" },
      { plateNumber: "B 1004 GBS", category: "Goldenbird Sedan", model: "BMW 5 Series", year: 2024, capacity: 4, status: "available", dailyRate: "2700000" },
      { plateNumber: "B 1005 GBS", category: "Goldenbird Sedan", model: "Toyota Alphard", year: 2023, capacity: 6, status: "maintenance", dailyRate: "2200000", maintenanceCompletionDate: futureDate(2), maintenanceNote: "Scheduled brake pad replacement and full service" },
      // Goldenbird SUVs
      { plateNumber: "B 2001 SUV", category: "Goldenbird SUV", model: "Toyota Fortuner", year: 2023, capacity: 7, status: "available", dailyRate: "1800000" },
      { plateNumber: "B 2002 SUV", category: "Goldenbird SUV", model: "Toyota Fortuner", year: 2024, capacity: 7, status: "booked", dailyRate: "1850000" },
      { plateNumber: "B 2003 SUV", category: "Goldenbird SUV", model: "Mitsubishi Pajero Sport", year: 2023, capacity: 7, status: "available", dailyRate: "1700000" },
      { plateNumber: "B 2004 SUV", category: "Goldenbird SUV", model: "Toyota Land Cruiser", year: 2024, capacity: 7, status: "maintenance", dailyRate: "3200000", maintenanceCompletionDate: futureDate(-1), maintenanceNote: "Awaiting imported parts (transmission)" },
      // Bigbird Buses
      { plateNumber: "B 7001 BBB", category: "Bigbird Bus", model: "Mercedes-Benz OH 1626", year: 2022, capacity: 45, status: "available", dailyRate: "5500000" },
      { plateNumber: "B 7002 BBB", category: "Bigbird Bus", model: "Mercedes-Benz OH 1626", year: 2022, capacity: 45, status: "booked", dailyRate: "5500000" },
      { plateNumber: "B 7003 BBB", category: "Bigbird Bus", model: "Hino R260", year: 2023, capacity: 50, status: "available", dailyRate: "5800000" },
      { plateNumber: "B 7004 BBB", category: "Bigbird Bus", model: "Scania K360", year: 2024, capacity: 48, status: "available", dailyRate: "6200000" },
      { plateNumber: "B 7005 BBB", category: "Bigbird Bus", model: "Hino R260", year: 2022, capacity: 35, status: "maintenance", dailyRate: "4800000", maintenanceCompletionDate: futureDate(7), maintenanceNote: "Engine overhaul in progress" },
      { plateNumber: "B 7006 BBB", category: "Bigbird Bus", model: "Mercedes-Benz OH 1526", year: 2023, capacity: 40, status: "available", dailyRate: "5200000" },
    ])
    .returning();

  // Drivers
  const drivers = await db
    .insert(driversTable)
    .values([
      { name: "Agus Setiawan", licenseNumber: "SIM-B2-001234", phone: "+62 812 1111 0001", status: "available", rating: "4.92", yearsOfService: 8 },
      { name: "Bambang Hartono", licenseNumber: "SIM-B2-001235", phone: "+62 812 1111 0002", status: "on_trip", rating: "4.85", yearsOfService: 12 },
      { name: "Cahyo Nugroho", licenseNumber: "SIM-B2-001236", phone: "+62 812 1111 0003", status: "available", rating: "4.78", yearsOfService: 5 },
      { name: "Dedi Mulyadi", licenseNumber: "SIM-B2-001237", phone: "+62 812 1111 0004", status: "on_trip", rating: "4.95", yearsOfService: 15 },
      { name: "Eko Prasetyo", licenseNumber: "SIM-B1-001238", phone: "+62 812 1111 0005", status: "available", rating: "4.70", yearsOfService: 3 },
      { name: "Faisal Rahman", licenseNumber: "SIM-B2-001239", phone: "+62 812 1111 0006", status: "on_trip", rating: "4.88", yearsOfService: 9 },
      { name: "Gunawan Susilo", licenseNumber: "SIM-B1-001240", phone: "+62 812 1111 0007", status: "available", rating: "4.82", yearsOfService: 6 },
      { name: "Hendra Kusuma", licenseNumber: "SIM-B2-001241", phone: "+62 812 1111 0008", status: "off_duty", rating: "4.65", yearsOfService: 4 },
      { name: "Indra Permana", licenseNumber: "SIM-B1-001242", phone: "+62 812 1111 0009", status: "available", rating: "4.90", yearsOfService: 11 },
      { name: "Joko Widodo", licenseNumber: "SIM-B2-001243", phone: "+62 812 1111 0010", status: "off_duty", rating: "4.74", yearsOfService: 7 },
    ])
    .returning();

  // Orders
  const year = new Date().getFullYear();
  const orderInputs = [
    {
      orderNumber: `BB-${year}-0001`,
      clientId: clients[2].id, // Mandiri
      vehicleId: vehicles[2].id, // E-Class booked
      driverId: drivers[1].id, // Bambang on_trip
      startDate: relDate(-2),
      endDate: relDate(1),
      pickupLocation: "Plaza Mandiri, Jakarta",
      dropoffLocation: "Bandara Soekarno-Hatta",
      price: "11200000",
      status: "active",
      notes: "Executive transport for board meeting in Bandung",
    },
    {
      orderNumber: `BB-${year}-0002`,
      clientId: clients[0].id, // Astra
      vehicleId: vehicles[6].id, // Fortuner 2024 booked
      driverId: drivers[3].id, // Dedi on_trip
      startDate: relDate(-1),
      endDate: relDate(3),
      pickupLocation: "Astra HQ, Sunter",
      dropoffLocation: "Cikarang Industrial Estate",
      price: "9250000",
      status: "active",
      notes: "Site visit for plant operations review",
    },
    {
      orderNumber: `BB-${year}-0003`,
      clientId: clients[1].id, // Telkom
      vehicleId: vehicles[10].id, // Bus booked
      driverId: drivers[5].id, // Faisal on_trip
      startDate: relDate(0),
      endDate: relDate(2),
      pickupLocation: "Telkom HQ, Bandung",
      dropoffLocation: "Telkom Training Center, Lembang",
      price: "16500000",
      status: "active",
      notes: "Annual leadership offsite — 42 attendees",
    },
    {
      orderNumber: `BB-${year}-0004`,
      clientId: clients[3].id, // Pertamina
      vehicleId: vehicles[5].id, // Fortuner available
      driverId: drivers[6].id, // Gunawan
      startDate: relDate(7),
      endDate: relDate(10),
      pickupLocation: "Pertamina HQ, Jakarta",
      dropoffLocation: "Cilacap Refinery",
      price: "7200000",
      status: "draft",
      notes: "Pending client approval",
    },
    {
      orderNumber: `BB-${year}-0005`,
      clientId: clients[4].id, // Unilever
      vehicleId: vehicles[12].id, // Hino R260 available
      driverId: drivers[8].id, // Indra
      startDate: relDate(-30),
      endDate: relDate(-28),
      pickupLocation: "Unilever HQ, BSD",
      dropoffLocation: "Distribution Center, Cikampek",
      price: "11600000",
      status: "completed",
      notes: "Quarterly distributor conference",
    },
  ];

  const orders = await db.insert(ordersTable).values(orderInputs).returning();

  // Invoices: one paid for the completed order, two outstanding for active ones (already partially billed)
  const completedOrder = orders.find((o) => o.status === "completed")!;
  const activeOrder1 = orders.find((o) => o.orderNumber === `BB-${year}-0001`)!;

  await db.insert(invoicesTable).values([
    {
      invoiceNumber: `INV-${year}-0001`,
      orderId: completedOrder.id,
      amount: completedOrder.price,
      status: "paid",
      issuedDate: relDate(-27),
      dueDate: relDate(3),
      paidDate: relDate(-15),
    },
    {
      invoiceNumber: `INV-${year}-0002`,
      orderId: activeOrder1.id,
      amount: activeOrder1.price,
      status: "outstanding",
      issuedDate: relDate(-1),
      dueDate: relDate(29),
    },
  ]);

  console.log(
    `Seeded ${clients.length} clients, ${vehicles.length} vehicles, ${drivers.length} drivers, ${orders.length} orders, 2 invoices.`,
  );
  process.exit(0);
}

function relDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function futureDate(daysFromToday: number): string {
  return relDate(daysFromToday);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
