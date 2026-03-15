/**
 * CSV/Excel 내보내기 유틸리티
 * 각 페이지에서 import하여 재사용
 */

interface ExportColumn {
  key: string;
  label: string;
}

/**
 * 데이터를 CSV 문자열로 변환
 */
function toCSV(columns: ExportColumn[], data: Record<string, unknown>[]): string {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel 한글 호환
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(","),
  );
  return BOM + [header, ...rows].join("\n");
}

/**
 * 브라우저에서 파일 다운로드 트리거
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 데이터를 CSV 파일로 다운로드
 */
export function exportToCSV(
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string,
): void {
  const csv = toCSV(columns, data);
  downloadFile(csv, filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8");
}

/**
 * JSON 데이터를 Excel-호환 HTML 테이블로 다운로드 (.xls)
 * 실제 xlsx 라이브러리 없이 간단한 Excel 호환 출력
 */
export function exportToExcel(
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string,
): void {
  const header = columns.map((c) => `<th>${c.label}</th>`).join("");
  const rows = data
    .map(
      (row) =>
        "<tr>" +
        columns
          .map((c) => `<td>${row[c.key] ?? ""}</td>`)
          .join("") +
        "</tr>",
    )
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  downloadFile(
    html,
    filename.endsWith(".xls") ? filename : `${filename}.xls`,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

/**
 * window.print() 래퍼
 */
export function printPage(): void {
  window.print();
}
