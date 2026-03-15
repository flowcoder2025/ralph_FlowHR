import { PrismaClient } from "@prisma/client";
import type { FullConfig } from "@playwright/test";

/**
 * Playwright globalTeardown — E2E 테스트 종료 후 DB 정리
 *
 * 테스트 데이터를 삭제하여 다음 실행에 영향을 주지 않도록 합니다.
 * 삭제 순서: 외래키 의존성 역순 (자식 → 부모)
 */
export default async function globalTeardown(
  _config: FullConfig,
): Promise<void> {
  console.log("\n[globalTeardown] E2E DB 정리 시작...");

  const prisma = new PrismaClient();

  try {
    // 외래키 의존성 역순으로 삭제
    await prisma.$transaction([
      // Platform
      prisma.platformAuditLog.deleteMany(),
      prisma.supportTicket.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.billingAccount.deleteMany(),
      prisma.plan.deleteMany(),

      // Recruiting
      prisma.offboardingTask.deleteMany(),
      prisma.onboardingTask.deleteMany(),
      prisma.application.deleteMany(),
      prisma.jobPosting.deleteMany(),

      // Performance
      prisma.oneOnOne.deleteMany(),
      prisma.evaluation.deleteMany(),
      prisma.goal.deleteMany(),
      prisma.evalCycle.deleteMany(),

      // Payroll
      prisma.payslip.deleteMany(),
      prisma.payrollRun.deleteMany(),
      prisma.payrollRule.deleteMany(),

      // Documents
      prisma.signature.deleteMany(),
      prisma.document.deleteMany(),
      prisma.documentTemplate.deleteMany(),

      // Workflow
      prisma.approvalStep.deleteMany(),
      prisma.approvalRequest.deleteMany(),
      prisma.workflow.deleteMany(),

      // Leave
      prisma.leaveRequest.deleteMany(),
      prisma.leaveBalance.deleteMany(),
      prisma.leavePolicy.deleteMany(),

      // Attendance
      prisma.attendanceClosing.deleteMany(),
      prisma.attendanceException.deleteMany(),
      prisma.attendanceRecord.deleteMany(),
      prisma.shiftAssignment.deleteMany(),
      prisma.shift.deleteMany(),

      // People
      prisma.employeeChange.deleteMany(),
      prisma.employee.deleteMany(),
      prisma.department.deleteMany(),
      prisma.position.deleteMany(),

      // Auth
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.verificationToken.deleteMany(),
      prisma.user.deleteMany(),
      prisma.role.deleteMany(),
      prisma.tenant.deleteMany(),
    ]);

    console.log("[globalTeardown] DB 정리 완료\n");
  } catch (error) {
    console.error("[globalTeardown] DB 정리 실패:", error);
  } finally {
    await prisma.$disconnect();
  }
}
