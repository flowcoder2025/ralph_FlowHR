# Codebase Map (auto-generated: 2026-03-14 18:03)

## Structure
./.claude/rules/project.md
./.editorconfig
./.env.example
./.eslintrc.json
./.gitattributes
./.github/PULL_REQUEST_TEMPLATE.md
./.github/workflows/ci.yml
./.github/workflows/commit-check.yml
./.gitignore
./.mcp.json
./.prettierignore
./.prettierrc
./.ralph/AGENT.md
./.ralph/fix_plan.md
./.ralph/guardrails.md
./.ralph/hooks/commit-msg
./.ralph/hooks/pre-push
./.ralph/logs/claude_parallel_1_1.log
./.ralph/logs/claude_parallel_2_1.log
./.ralph/logs/claude_parallel_3_1.log
./.ralph/logs/pr_1.log
./.ralph/logs/push_1.log
./.ralph/logs/ralph.log
./.ralph/loop_state.json
./.ralph/prd-state.json
./.ralph/PROMPT.md
./.ralph/rag/codebase-map.md
./.ralph/rag/patterns.md
./.ralph/rag/wi-history.md
./.ralphrc
./CLAUDE.md
./docs/L0-vision/README.md
./docs/L1-domain/attendance.md
./docs/L1-domain/auth.md
./docs/L1-domain/documents.md
./docs/L1-domain/employee-portal.md
./docs/L1-domain/leave.md
./docs/L1-domain/payroll.md
./docs/L1-domain/people.md
./docs/L1-domain/performance.md
./docs/L1-domain/platform-console.md
./docs/L1-domain/recruiting.md
./docs/L1-domain/reports.md
./docs/L1-domain/settings.md
./docs/L1-domain/shared.md
./docs/L1-domain/workflow.md
./next.config.mjs
./package.json
./package-lock.json
./postcss.config.mjs
./PRD.md
./prisma/schema.prisma
./prisma/seed.ts
./ralph.sh
./src/app/globals.css
./src/app/layout.tsx
./src/app/page.tsx
./src/lib/auth.ts
./src/lib/prisma.ts
./src/lib/rbac.ts
./src/lib/useAuth.ts
./src/middleware.ts
./src/types/next-auth.d.ts
./tailwind.config.ts
./tsconfig.json

## DB Models
- Tenant {
- Role {
- User {
- Account {
- Session {
- VerificationToken {
- Department {
- Position {
- Employee {
- EmployeeChange {
- Shift {
- ShiftAssignment {
- AttendanceRecord {
- AttendanceException {
- AttendanceClosing {
- LeavePolicy {
- LeaveBalance {
- LeaveRequest {
- Workflow {
- ApprovalRequest {
- ApprovalStep {
- DocumentTemplate {
- Document {
- Signature {
- PayrollRule {
- PayrollRun {
- Payslip {
- Goal {
- EvalCycle {
- Evaluation {
- OneOnOne {
- JobPosting {
- Application {
- OnboardingTask {
- OffboardingTask {

## Pages
- src/app/admin/attendance/page.tsx
- src/app/admin/documents/page.tsx
- src/app/admin/leave/page.tsx
- src/app/admin/org-chart/page.tsx
- src/app/admin/page.tsx
- src/app/admin/payroll/page.tsx
- src/app/admin/people/changes/page.tsx
- src/app/admin/people/page.tsx
- src/app/admin/performance/page.tsx
- src/app/admin/recruiting/page.tsx
- src/app/admin/reports/attendance/page.tsx
- src/app/admin/reports/page.tsx
- src/app/admin/reports/people/page.tsx
- src/app/admin/reports/scheduled/page.tsx
- src/app/admin/settings/page.tsx
- src/app/admin/workflow/page.tsx
- src/app/forbidden/page.tsx
- src/app/login/page.tsx
- src/app/page.tsx

## API Routes
- src/app/api/admin/dashboard/route.ts
- src/app/api/attendance/closing/route.ts
- src/app/api/attendance/dashboard/route.ts
- src/app/api/attendance/exceptions/route.ts
- src/app/api/attendance/records/route.ts
- src/app/api/attendance/shifts/route.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/departments/tree/route.ts
- src/app/api/documents/archive/route.ts
- src/app/api/documents/dashboard/route.ts
- src/app/api/documents/send/route.ts
- src/app/api/documents/templates/[id]/route.ts
- src/app/api/documents/templates/route.ts
- src/app/api/employee-changes/route.ts
- src/app/api/employees/[id]/route.ts
- src/app/api/employees/route.ts
- src/app/api/leave/calendar/route.ts
- src/app/api/leave/dashboard/route.ts
- src/app/api/leave/policies/[id]/route.ts
- src/app/api/leave/policies/route.ts
- src/app/api/leave/requests/route.ts
- src/app/api/payroll/closing/route.ts
- src/app/api/payroll/dashboard/route.ts
- src/app/api/payroll/payslips/[id]/route.ts
- src/app/api/payroll/payslips/route.ts
- src/app/api/payroll/rules/[id]/route.ts
- src/app/api/payroll/rules/route.ts
- src/app/api/performance/dashboard/route.ts
- src/app/api/performance/eval-progress/route.ts
- src/app/api/performance/eval-settings/route.ts
- src/app/api/performance/one-on-one/route.ts
- src/app/api/recruiting/applications/[id]/route.ts
- src/app/api/recruiting/applications/route.ts
- src/app/api/recruiting/dashboard/route.ts
- src/app/api/recruiting/offboarding/route.ts
- src/app/api/recruiting/onboarding/route.ts
- src/app/api/recruiting/postings/[id]/route.ts
- src/app/api/recruiting/postings/route.ts
- src/app/api/reports/attendance/route.ts
- src/app/api/reports/dashboard/route.ts
- src/app/api/reports/people/route.ts
- src/app/api/reports/scheduled/route.ts
- src/app/api/settings/company/route.ts
- src/app/api/settings/roles/[id]/route.ts
- src/app/api/settings/roles/route.ts
- src/app/api/workflow/dashboard/route.ts
- src/app/api/workflow/history/route.ts
- src/app/api/workflow/requests/[id]/route.ts
- src/app/api/workflow/workflows/[id]/route.ts
- src/app/api/workflow/workflows/route.ts

## Component Dirs
- src/components/ (3 files)

