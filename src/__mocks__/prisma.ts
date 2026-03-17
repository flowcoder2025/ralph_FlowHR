import { vi } from "vitest";

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({ _sum: {} }),
  };
}

export const prismaMock = {
  tenant: createModelMock(),
  user: createModelMock(),
  account: createModelMock(),
  employee: createModelMock(),
  department: createModelMock(),
  position: createModelMock(),
  shift: createModelMock(),
  shiftAssignment: createModelMock(),
  attendanceRecord: createModelMock(),
  attendanceException: createModelMock(),
  attendanceClosing: createModelMock(),
  leaveRequest: createModelMock(),
  leaveBalance: createModelMock(),
  leavePolicy: createModelMock(),
  approvalRequest: createModelMock(),
  document: createModelMock(),
  payrollRun: createModelMock(),
  payslip: createModelMock(),
  goal: createModelMock(),
  evalCycle: createModelMock(),
  evaluation: createModelMock(),
  oneOnOne: createModelMock(),
  $transaction: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
