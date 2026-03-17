"use client";

import {
  Card,
  CardBody,
  Button,
  Badge,
} from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface IntegrationService {
  id: string;
  name: string;
  description: string;
  initial: string;
  bgColor: string;
  connected: boolean;
  detail: { label: string; value: string }[];
}

// ─── Constants ──────────────────────────────────────────────

const INTEGRATION_SERVICES: IntegrationService[] = [
  {
    id: "slack",
    name: "Slack",
    description: "메시지 알림 연동",
    initial: "S",
    bgColor: "#4A154B",
    connected: true,
    detail: [
      { label: "상태", value: "연결됨" },
      { label: "워크스페이스", value: "flowcommerce" },
      { label: "마지막 동기화", value: "2분 전" },
    ],
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "SSO 및 캘린더 연동",
    initial: "G",
    bgColor: "#0078D4",
    connected: true,
    detail: [
      { label: "상태", value: "연결됨" },
      { label: "도메인", value: "flowcommerce.kr" },
      { label: "마지막 동기화", value: "15분 전" },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    description: "프로젝트/이슈 연동",
    initial: "J",
    bgColor: "#333333",
    connected: false,
    detail: [
      { label: "상태", value: "설정 필요" },
      { label: "도메인", value: "\u2014" },
      { label: "마지막 동기화", value: "\u2014" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────

export function IntegrationsTab() {
  const { addToast } = useToast();
  return (
    <div className="space-y-sp-4">
      <div className="flex items-center justify-between">
        <h2 className="text-md font-semibold text-text-primary">연동 관리</h2>
      </div>
      <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-2 lg:grid-cols-3">
        {INTEGRATION_SERVICES.map((svc) => (
          <Card key={svc.id}>
            <CardBody>
              <div className="p-sp-1">
                {/* 서비스 헤더 */}
                <div className="flex items-center gap-sp-3 mb-sp-4">
                  <div
                    className="flex items-center justify-center rounded-md text-white font-bold text-lg"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: svc.bgColor,
                    }}
                  >
                    {svc.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">
                      {svc.name}
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {svc.description}
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="space-y-sp-2">
                  {svc.detail.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-tertiary">{d.label}</span>
                      <span className="text-text-primary">
                        {d.label === "상태" ? (
                          <Badge
                            variant={svc.connected ? "success" : "warning"}
                          >
                            {d.value}
                          </Badge>
                        ) : (
                          d.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="mt-sp-4">
                  <Button
                    variant={svc.connected ? "secondary" : "primary"}
                    size="sm"
                    className="w-full"
                    onClick={() => addToast({ message: `${svc.name} 연동 설정 기능 준비 중입니다.`, variant: "info" })}
                  >
                    {svc.connected ? "설정" : "연결하기"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
