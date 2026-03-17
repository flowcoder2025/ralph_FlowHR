import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/* ────────────────────────────────────────────
   GET  /api/approval/requests
   결재 목록 (tenantId + status 필터 + 페이지네이션)
   ──────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: Record<string, unknown> = { tenantId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [total, requests] = await Promise.all([
      prisma.approvalRequest.count({ where }),
      prisma.approvalRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
              department: { select: { name: true } },
            },
          },
          workflow: {
            select: { id: true, name: true },
          },
          steps: {
            select: {
              id: true,
              stepOrder: true,
              status: true,
              comment: true,
              actionAt: true,
              approver: {
                select: { id: true, name: true },
              },
            },
            orderBy: { stepOrder: "asc" },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const items = requests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      requestType: r.requestType,
      requester: {
        id: r.requester.id,
        name: r.requester.name,
        employeeNumber: r.requester.employeeNumber,
        department: r.requester.department?.name ?? "-",
      },
      workflow: {
        id: r.workflow.id,
        name: r.workflow.name,
      },
      steps: r.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        status: s.status,
        comment: s.comment,
        actionAt: s.actionAt?.toISOString() ?? null,
        approverName: s.approver.name,
      })),
      escalatedAt: r.escalatedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: items,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error("[approval/requests GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/* ────────────────────────────────────────────
   POST  /api/approval/requests
   결재 신청 (workflowId, title, description, requesterId)
   ──────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { workflowId, title, description, requesterId } = body as {
      workflowId: string;
      title: string;
      description?: string;
      requesterId: string;
    };

    if (!workflowId || !title || !requesterId) {
      return NextResponse.json(
        { error: "workflowId, title, requesterId는 필수입니다" },
        { status: 400 },
      );
    }

    // 워크플로우 존재 여부 확인
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, tenantId, status: "ACTIVE" },
    });
    if (!workflow) {
      return NextResponse.json(
        { error: "활성 상태의 워크플로우를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // 요청자 존재 여부 확인
    const requester = await prisma.employee.findFirst({
      where: { id: requesterId, tenantId },
    });
    if (!requester) {
      return NextResponse.json(
        { error: "요청자를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        tenantId,
        workflowId,
        requesterId,
        title,
        description: description || null,
        status: "PENDING",
        priority: "MEDIUM",
        requestType: workflow.triggerType,
      },
    });

    return NextResponse.json({ data: approvalRequest }, { status: 201 });
  } catch (error) {
    console.error("[approval/requests POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/* ────────────────────────────────────────────
   PATCH  /api/approval/requests
   결재 처리 (id, action: "approve" | "reject" | "escalate", comment)
   ──────────────────────────────────────────── */
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { id, action, comment } = body as {
      id: string;
      action: "approve" | "reject" | "escalate";
      comment?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id와 action은 필수입니다" },
        { status: 400 },
      );
    }

    if (!["approve", "reject", "escalate"].includes(action)) {
      return NextResponse.json(
        { error: "action은 approve, reject, escalate 중 하나여야 합니다" },
        { status: 400 },
      );
    }

    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        id,
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { error: "처리 가능한 결재 요청을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const now = new Date();

    if (action === "approve") {
      await prisma.approvalRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          completedAt: now,
        },
      });
    } else if (action === "reject") {
      await prisma.approvalRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          completedAt: now,
        },
      });
    } else {
      // escalate
      await prisma.approvalRequest.update({
        where: { id },
        data: {
          status: "ESCALATED",
          escalatedAt: now,
        },
      });
    }

    // comment가 있으면 현재 처리자의 최신 step에 코멘트 기록
    if (comment) {
      const currentEmployee = await prisma.employee.findFirst({
        where: { userId: token.id as string, tenantId },
      });

      if (currentEmployee) {
        const latestStep = await prisma.approvalStep.findFirst({
          where: { requestId: id, approverId: currentEmployee.id },
          orderBy: { stepOrder: "desc" },
        });

        if (latestStep) {
          await prisma.approvalStep.update({
            where: { id: latestStep.id },
            data: {
              status: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "ESCALATED",
              comment,
              actionAt: now,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[approval/requests PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
