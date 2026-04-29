import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { FileKind, RequestStatus, UserRole } from "../src/generated/prisma/enums";
import { hash } from "bcrypt";
import { createLibSqlAdapter } from "../src/lib/libsql-adapter";

const ROUNDS = 10;

const prisma = new PrismaClient({
  adapter: createLibSqlAdapter(),
});

async function main() {
  const [admin, employee, citizen] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@bosra.local" },
      update: {
        permManageServices: true,
        permManageUsers: true,
        permViewStats: true,
      },
      create: {
        email: "admin@bosra.local",
        name: "رئيس البلدية (تجريبي)",
        passwordHash: await hash("Admin123", ROUNDS),
        role: UserRole.ADMIN,
        permManageServices: true,
        permManageUsers: true,
        permViewStats: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "employee@bosra.local" },
      update: {
        permManageServices: true,
        permManageUsers: false,
        permViewStats: true,
      },
      create: {
        email: "employee@bosra.local",
        name: "موظف الاستقبال (تجريبي)",
        passwordHash: await hash("Employee123", ROUNDS),
        role: UserRole.EMPLOYEE,
        permManageServices: true,
        permManageUsers: false,
        permViewStats: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "citizen@example.com" },
      update: {
        phone: "963900000001",
      },
      create: {
        email: "citizen@example.com",
        phone: "963900000001",
        name: "مواطن تجريبي",
        passwordHash: await hash("Citizen123", ROUNDS),
        role: UserRole.CITIZEN,
      },
    }),
  ]);

  const svc = await prisma.service.upsert({
    where: { id: "seed-service-1" },
    update: {},
    create: {
      id: "seed-service-1",
      name: "رخصة بناء (تجريبية)",
      description: "طلب تقديري لرخصة بناء، للاختبار داخل النظام.",
      price: "500.00",
    },
  });

  await prisma.requestFile.deleteMany({
    where: { serviceDocument: { serviceId: svc.id } },
  });
  await prisma.serviceDocument.deleteMany({ where: { serviceId: svc.id } });
  await prisma.serviceDocument.createMany({
    data: [
      {
        serviceId: svc.id,
        name: "هوية سارية",
        isRequired: true,
        fileType: FileKind.IMAGE,
        sortOrder: 0,
      },
      {
        serviceId: svc.id,
        name: "مخطط عقاري (PDF)",
        isRequired: true,
        fileType: FileKind.PDF,
        sortOrder: 1,
      },
      {
        serviceId: svc.id,
        name: "وثيقة اختيارية (أي تنسيق)",
        isRequired: false,
        fileType: FileKind.ANY,
        sortOrder: 2,
      },
    ],
  });

  // Demo request
  const existing = await prisma.request.findFirst();
  if (!existing) {
    const reqN = "REQ-2026-00001";
    const r = await prisma.request.create({
      data: {
        requestNumber: reqN,
        serviceId: svc.id,
        citizenId: citizen.id,
        assigneeId: employee.id,
        status: RequestStatus.UNDER_REVIEW,
        formPayload: "{}",
      },
    });
    await prisma.$transaction([
      prisma.requestSerial.upsert({
        where: { year: 2026 },
        create: { year: 2026, lastN: 1 },
        update: { lastN: 1 },
      }),
      prisma.requestStatusLog.create({
        data: {
          requestId: r.id,
          actorId: admin.id,
          fromStatus: RequestStatus.PENDING,
          toStatus: RequestStatus.UNDER_REVIEW,
        },
      }),
    ]);
  }

  console.log("Seeded users:", { admin, employee, citizen });
  console.log("Seeded service:", svc.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
