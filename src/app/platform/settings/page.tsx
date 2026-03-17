"use client";

import { Suspense, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Input,
  Badge,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface PlatformSettings {
  smtp: {
    host: string;
    port: number;
    fromEmail: string;
    fromName: string;
    encryption: string;
  };
  storage: {
    provider: string;
    bucket: string;
    region: string;
    maxFileSizeMb: number;
  };
  security: {
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireMfa: boolean;
    ipWhitelist: string;
  };
  general: {
    platformName: string;
    supportEmail: string;
    maintenanceMode: boolean;
    defaultLocale: string;
    defaultTimezone: string;
  };
}

// ─── Static defaults (읽기 전용) ────────────────────────────

function getDefaultSettings(): PlatformSettings {
  return {
    smtp: {
      host: "smtp.flowhr.io",
      port: 587,
      fromEmail: "noreply@flowhr.io",
      fromName: "FlowHR",
      encryption: "STARTTLS",
    },
    storage: {
      provider: "S3",
      bucket: "flowhr-production",
      region: "ap-northeast-2",
      maxFileSizeMb: 50,
    },
    security: {
      sessionTimeoutMinutes: 480,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireMfa: false,
      ipWhitelist: "",
    },
    general: {
      platformName: "FlowHR",
      supportEmail: "support@flowhr.io",
      maintenanceMode: false,
      defaultLocale: "ko-KR",
      defaultTimezone: "Asia/Seoul",
    },
  };
}

// ─── Component ──────────────────────────────────────────────

export default function PlatformSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettings(getDefaultSettings());
    setLoading(false);
  }, []);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            플랫폼 설정
          </h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            시스템 전역 설정 관리
          </p>
        </div>
        <Badge variant="neutral">읽기 전용</Badge>
      </div>

      <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
        {/* 일반 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>일반 설정</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-sp-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  플랫폼 이름
                </label>
                <Input
                  value={settings.general.platformName}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  지원 이메일
                </label>
                <Input
                  value={settings.general.supportEmail}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  기본 언어
                </label>
                <Input
                  value={settings.general.defaultLocale}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  기본 시간대
                </label>
                <Input
                  value={settings.general.defaultTimezone}
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">유지보수 모드</span>
                <Badge variant={settings.general.maintenanceMode ? "warning" : "success"}>
                  {settings.general.maintenanceMode ? "활성" : "비활성"}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* SMTP 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>SMTP 설정</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-sp-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  호스트
                </label>
                <Input
                  value={settings.smtp.host}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  포트
                </label>
                <Input
                  value={String(settings.smtp.port)}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  발신 이메일
                </label>
                <Input
                  value={settings.smtp.fromEmail}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  발신자명
                </label>
                <Input
                  value={settings.smtp.fromName}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  암호화
                </label>
                <Input
                  value={settings.smtp.encryption}
                  readOnly
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 저장소 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>저장소 설정</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-sp-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  프로바이더
                </label>
                <Input
                  value={settings.storage.provider}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  버킷
                </label>
                <Input
                  value={settings.storage.bucket}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  리전
                </label>
                <Input
                  value={settings.storage.region}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  최대 파일 크기
                </label>
                <Input
                  value={`${settings.storage.maxFileSizeMb} MB`}
                  readOnly
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>보안 정책</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-sp-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  세션 타임아웃
                </label>
                <Input
                  value={`${settings.security.sessionTimeoutMinutes}분`}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  최대 로그인 시도
                </label>
                <Input
                  value={`${settings.security.maxLoginAttempts}회`}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  최소 비밀번호 길이
                </label>
                <Input
                  value={`${settings.security.passwordMinLength}자`}
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">MFA 필수</span>
                <Badge variant={settings.security.requireMfa ? "success" : "neutral"}>
                  {settings.security.requireMfa ? "필수" : "선택"}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  IP 화이트리스트
                </label>
                <Input
                  value={settings.security.ipWhitelist || "제한 없음"}
                  readOnly
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
