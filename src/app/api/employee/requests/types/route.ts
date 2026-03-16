import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const LEAVE_TYPE_META: Record<
  string,
  { icon: string; label: string; description: string }
> = {
  ANNUAL: {
    icon: "\uD83C\uDF34",
    label: "\uC5F0\uCC28 \uC2E0\uCCAD",
    description: "\uC5F0\uCC28 \uD734\uAC00\uB97C \uC2E0\uCCAD\uD569\uB2C8\uB2E4",
  },
  HALF_DAY: {
    icon: "\uD83C\uDF24",
    label: "\uBC18\uCC28 \uC2E0\uCCAD",
    description: "\uC624\uC804 \uB610\uB294 \uC624\uD6C4 \uBC18\uCC28 \uC2E0\uCCAD",
  },
  SICK: {
    icon: "\uD83C\uDFE5",
    label: "\uBCD1\uAC00 \uC2E0\uCCAD",
    description: "\uC9C4\uB2E8\uC11C \uCCA8\uBD80 \uBCD1\uAC00 \uC2E0\uCCAD",
  },
  FAMILY_EVENT: {
    icon: "\uD83C\uDF8A",
    label: "\uACBD\uC870\uC0AC \uD734\uAC00",
    description: "\uACBD\uC870\uC0AC \uD734\uAC00\uB97C \uC2E0\uCCAD\uD569\uB2C8\uB2E4",
  },
  COMPENSATORY: {
    icon: "\uD83D\uDD04",
    label: "\uB300\uCCB4 \uD734\uAC00",
    description: "\uB300\uCCB4 \uD734\uAC00\uB97C \uC2E0\uCCAD\uD569\uB2C8\uB2E4",
  },
};

const STATIC_REQUEST_TYPES = [
  {
    id: "checkin_fix",
    icon: "\uD83D\uDD50",
    label: "\uCD9C\uADFC \uC815\uC815",
    description: "\uCD9C\uADFC \uC2DC\uAC04 \uC815\uC815 \uC694\uCCAD",
    isLeave: false,
    isCorrection: true,
  },
  {
    id: "checkout_fix",
    icon: "\uD83D\uDD55",
    label: "\uD1F4\uADFC \uC815\uC815",
    description: "\uD1F4\uADFC \uC2DC\uAC04 \uC815\uC815 \uC694\uCCAD",
    isLeave: false,
    isCorrection: true,
  },
  {
    id: "expense",
    icon: "\uD83D\uDCB3",
    label: "\uACBD\uBE44 \uCCAD\uAD6C",
    description: "\uC5C5\uBB34 \uAD00\uB828 \uACBD\uBE44 \uCCAD\uAD6C",
    isLeave: false,
    isCorrection: false,
  },
  {
    id: "general",
    icon: "\uD83D\uDCDD",
    label: "\uC77C\uBC18 \uD488\uC758",
    description: "\uAE30\uD0C0 \uACB0\uC7AC \uD488\uC758 \uC2E0\uCCAD",
    isLeave: false,
    isCorrection: false,
  },
];

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;

  const policies = await prisma.leavePolicy.findMany({
    where: { tenantId, isActive: true },
    orderBy: { type: "asc" },
  });

  const leaveTypes = policies
    .filter((p) => LEAVE_TYPE_META[p.type])
    .map((p) => ({
      id: p.type.toLowerCase(),
      ...LEAVE_TYPE_META[p.type],
      isLeave: true,
      isCorrection: false,
    }));

  let remainingLeave = 0;
  const employee = await prisma.employee.findFirst({
    where: { userId: token.id as string, tenantId: tenantId as string },
  });
  if (employee) {
    const balances = await prisma.leaveBalance.findMany({
      where: {
        tenantId,
        employeeId: employee.id,
        year: new Date().getFullYear(),
      },
    });
    remainingLeave = balances.reduce(
      (sum, b) => sum + (b.totalDays - b.usedDays - b.pendingDays),
      0,
    );
  }

  return NextResponse.json({
    types: [...leaveTypes, ...STATIC_REQUEST_TYPES],
    remainingLeave,
  });
}
