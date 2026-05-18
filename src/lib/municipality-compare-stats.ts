import { db } from "@/lib/db";
import { RequestStatus, UserRole } from "@/generated/prisma/enums";

export type MunicipalityCompareRow = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
  citizens: number;
  staff: number;
  services: number;
  requests: number;
  requestsPending: number;
  requestsCompleted: number;
  gasRequests: number;
  socialCases: number;
  returnees: number;
  feedback: number;
};

function countMap(rows: { municipalityId: string; _count: { _all: number } }[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.municipalityId, r._count._all);
  return m;
}

/** إحصائيات مقارنة لكل بلدية — لمشرف المحافظة */
export async function fetchMunicipalityCompareStats(): Promise<MunicipalityCompareRow[]> {
  const municipalities = await db.municipality.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, code: true, isActive: true, sortOrder: true },
  });

  const [
    citizens,
    staff,
    services,
    requests,
    requestsPending,
    requestsCompleted,
    gas,
    social,
    returnees,
    feedback,
  ] = await Promise.all([
    db.user.groupBy({
      by: ["municipalityId"],
      where: { role: UserRole.CITIZEN, municipalityId: { not: null } },
      _count: { _all: true },
    }),
    db.user.groupBy({
      by: ["municipalityId"],
      where: {
        municipalityId: { not: null },
        role: { in: [UserRole.EMPLOYEE, UserRole.MUNICIPALITY_ADMIN, UserRole.GAS_AGENT] },
      },
      _count: { _all: true },
    }),
    db.service.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
    db.request.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
    db.request.groupBy({
      by: ["municipalityId"],
      where: { status: RequestStatus.PENDING },
      _count: { _all: true },
    }),
    db.request.groupBy({
      by: ["municipalityId"],
      where: { status: RequestStatus.COMPLETED },
      _count: { _all: true },
    }),
    db.gasRequest.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
    db.socialServiceCase.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
    db.returneeRegistration.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
    db.citizenFeedback.groupBy({
      by: ["municipalityId"],
      _count: { _all: true },
    }),
  ]);

  const maps = {
    citizens: countMap(citizens as { municipalityId: string; _count: { _all: number } }[]),
    staff: countMap(staff as { municipalityId: string; _count: { _all: number } }[]),
    services: countMap(services),
    requests: countMap(requests),
    requestsPending: countMap(requestsPending),
    requestsCompleted: countMap(requestsCompleted),
    gas: countMap(gas),
    social: countMap(social),
    returnees: countMap(returnees),
    feedback: countMap(feedback),
  };

  return municipalities.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    isActive: m.isActive,
    sortOrder: m.sortOrder,
    citizens: maps.citizens.get(m.id) ?? 0,
    staff: maps.staff.get(m.id) ?? 0,
    services: maps.services.get(m.id) ?? 0,
    requests: maps.requests.get(m.id) ?? 0,
    requestsPending: maps.requestsPending.get(m.id) ?? 0,
    requestsCompleted: maps.requestsCompleted.get(m.id) ?? 0,
    gasRequests: maps.gas.get(m.id) ?? 0,
    socialCases: maps.social.get(m.id) ?? 0,
    returnees: maps.returnees.get(m.id) ?? 0,
    feedback: maps.feedback.get(m.id) ?? 0,
  }));
}

export function sumCompareRows(rows: MunicipalityCompareRow[]) {
  return rows.reduce(
    (acc, r) => ({
      citizens: acc.citizens + r.citizens,
      staff: acc.staff + r.staff,
      services: acc.services + r.services,
      requests: acc.requests + r.requests,
      requestsPending: acc.requestsPending + r.requestsPending,
      requestsCompleted: acc.requestsCompleted + r.requestsCompleted,
      gasRequests: acc.gasRequests + r.gasRequests,
      socialCases: acc.socialCases + r.socialCases,
      returnees: acc.returnees + r.returnees,
      feedback: acc.feedback + r.feedback,
    }),
    {
      citizens: 0,
      staff: 0,
      services: 0,
      requests: 0,
      requestsPending: 0,
      requestsCompleted: 0,
      gasRequests: 0,
      socialCases: 0,
      returnees: 0,
      feedback: 0,
    },
  );
}
