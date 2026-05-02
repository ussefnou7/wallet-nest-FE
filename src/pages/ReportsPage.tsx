import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { getFriendlyErrorMessage, mapApiError } from "@/lib/errors";
import type { TransactionType, Wallet } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FilterKey = "fromDate" | "toDate" | "walletId" | "type" | "active" | "period";
type ReportId =
  | "transactionSummary"
  | "transactionDetails"
  | "walletConsumption"
  | "profitSummary"
  | "transactionTimeAggregation";

interface ReportColumn {
  labelKey?: string;
  key?: string;
  field?: string;
  name?: string;
  accessor?: string;
  id?: string;
}

interface PaginatedData {
  content: Record<string, unknown>[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

interface ReportResponse {
  titleKey: string;
  columns?: ReportColumn[];
  data: Record<string, unknown> | Record<string, unknown>[] | PaginatedData | null;
}

type FiltersState = typeof DEFAULT_FILTERS;
type ExportRow = Record<string, unknown>;

const REPORT_CONFIGS: Array<{
  id: ReportId;
  endpoint: string;
  labelKey: string;
  filters: FilterKey[];
}> = [
  {
    id: "transactionSummary",
    endpoint: "/reports/transactions/summary",
    labelKey: "reports.options.transactionSummary",
    filters: ["fromDate", "toDate", "walletId", "type", "active"],
  },
  {
    id: "transactionDetails",
    endpoint: "/reports/transactions/details",
    labelKey: "reports.options.transactionDetails",
    filters: ["fromDate", "toDate", "walletId", "type", "active"],
  },
  {
    id: "walletConsumption",
    endpoint: "/reports/wallets/consumption",
    labelKey: "reports.options.walletConsumption",
    filters: ["fromDate", "toDate", "walletId", "active"],
  },
  {
    id: "profitSummary",
    endpoint: "/reports/profit/summary",
    labelKey: "reports.options.profitSummary",
    filters: ["fromDate", "toDate", "walletId", "active"],
  },
  {
    id: "transactionTimeAggregation",
    endpoint: "/reports/transactions/time-aggregation",
    labelKey: "reports.options.transactionTimeAggregation",
    filters: ["fromDate", "toDate", "walletId", "type", "active", "period"],
  },
];

const DEFAULT_FILTERS = {
  fromDate: "",
  toDate: "",
  walletId: "all",
  type: "all",
  active: "all",
  period: "DAY",
};

const PERIOD_OPTIONS = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const;
const PAGE_SIZE = 20;
const REPORT_HIDDEN_COLUMNS: Partial<Record<ReportId, string[]>> = {
  transactionSummary: ["transactionId", "createdByUserId"],
  transactionDetails: ["transactionId", "createdByUserId"],
  walletConsumption: ["walletConsumptionId"],
};

function getColumnAccessor(column: ReportColumn): string {
  return column.key ?? column.field ?? column.name ?? column.accessor ?? column.id ?? "";
}

function shouldHideColumnAccessor(accessor: string, allAccessors: string[]): boolean {
  if (!accessor.endsWith("Id")) {
    return false;
  }

  const nameAccessor = `${accessor.slice(0, -2)}Name`;
  return allAccessors.includes(nameAccessor);
}

function isPaginatedData(value: ReportResponse["data"]): value is PaginatedData {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "content" in value);
}

function isObjectData(value: ReportResponse["data"]): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && !("content" in value));
}

function isLikelyDate(value: string): boolean {
  return /\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatValue(value: unknown, language: string, t: (key: string) => string): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }

  if (typeof value === "number") {
    return value.toLocaleString(language);
  }

  if (typeof value === "string" && isLikelyDate(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(language);
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function translateOrFallback(t: (key: string) => string, key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function getColumnLabel(column: ReportColumn, t: (key: string) => string): string {
  const accessor = getColumnAccessor(column);

  if (column.labelKey) {
    return translateOrFallback(t, column.labelKey, accessor);
  }

  return translateOrFallback(
    t,
    `reports.fields.${accessor}`,
    translateOrFallback(t, `reports.dataKeys.${accessor}`, accessor),
  );
}

function toSafeFileName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function isArabicLanguage(language: string): boolean {
  return language.split("-")[0] === "ar";
}

function buildPdfSnapshotElement({
  title,
  generatedDateLabel,
  generatedDateValue,
  rows,
  rtl,
}: {
  title: string;
  generatedDateLabel: string;
  generatedDateValue: string;
  rows: ExportRow[];
  rtl: boolean;
}): HTMLDivElement {
  const container = document.createElement("div");
  const headers = Object.keys(rows[0] ?? {});

  container.lang = rtl ? "ar" : "en";
  container.dir = rtl ? "rtl" : "ltr";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "1100px";
  container.style.background = "#ffffff";
  container.style.color = "#111827";
  container.style.padding = "32px";
  container.style.boxSizing = "border-box";
  container.style.direction = rtl ? "rtl" : "ltr";
  container.style.textAlign = rtl ? "right" : "left";
  container.style.fontFamily = rtl
    ? "'Tahoma','Arial','Noto Sans Arabic','Segoe UI',sans-serif"
    : "'Segoe UI','Arial',sans-serif";

  const titleElement = document.createElement("h1");
  titleElement.textContent = title;
  titleElement.style.margin = "0 0 8px";
  titleElement.style.fontSize = "24px";
  titleElement.style.fontWeight = "700";

  const dateElement = document.createElement("p");
  dateElement.textContent = `${generatedDateLabel}: ${generatedDateValue}`;
  dateElement.style.margin = "0 0 20px";
  dateElement.style.fontSize = "14px";
  dateElement.style.color = "#4b5563";

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.direction = rtl ? "rtl" : "ltr";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const orderedHeaders = rtl ? [...headers].reverse() : headers;

  for (const header of orderedHeaders) {
    const th = document.createElement("th");
    th.textContent = header;
    th.style.border = "1px solid #d1d5db";
    th.style.background = "#f3f4f6";
    th.style.padding = "10px";
    th.style.fontSize = "13px";
    th.style.fontWeight = "700";
    th.style.textAlign = rtl ? "right" : "left";
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const entries = orderedHeaders.map((header) => row[header]);

    for (const value of entries) {
      const td = document.createElement("td");
      td.textContent = value === null || value === undefined ? "—" : String(value);
      td.style.border = "1px solid #d1d5db";
      td.style.padding = "10px";
      td.style.fontSize = "12px";
      td.style.verticalAlign = "top";
      td.style.textAlign = rtl ? "right" : "left";
      td.style.wordBreak = "break-word";
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(titleElement);
  container.appendChild(dateElement);
  container.appendChild(table);

  return container;
}

function buildExportRows(
  report: ReportResponse,
  columns: ReportColumn[],
  objectEntries: Array<[string, unknown]>,
  t: (key: string) => string,
): ExportRow[] {
  if (Array.isArray(report.data)) {
    return report.data.map((row) => {
      const nextRow: ExportRow = {};
      for (const column of columns) {
        const accessor = getColumnAccessor(column);
        const header = getColumnLabel(column, t);
        nextRow[header] = row[accessor];
      }
      return nextRow;
    });
  }

  if (isPaginatedData(report.data)) {
    return report.data.content.map((row) => {
      const nextRow: ExportRow = {};
      for (const column of columns) {
        const accessor = getColumnAccessor(column);
        const header = getColumnLabel(column, t);
        nextRow[header] = row[accessor];
      }
      return nextRow;
    });
  }

  if (isObjectData(report.data)) {
    return objectEntries.map(([key, value], index) => {
      const column = columns[index];
      const label = column
        ? getColumnLabel(column, t)
        : translateOrFallback(t, `reports.fields.${String(key)}`, String(key));

      return {
        [t("reports.export.keyColumn")]: label,
        [t("reports.export.valueColumn")]: value,
      };
    });
  }

  return [];
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation("common");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportId>("transactionSummary");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const selectedConfig = useMemo(
    () => REPORT_CONFIGS.find((config) => config.id === selectedReport) ?? REPORT_CONFIGS[0],
    [selectedReport],
  );

  const visibleFilters = new Set(selectedConfig.filters);

  const fetchReport = async (nextPage = 0, activeFilters: FiltersState = filters) => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {};

      for (const filterKey of selectedConfig.filters) {
        const value = activeFilters[filterKey];
        if (!value || value === "all") {
          continue;
        }
        params[filterKey] = value;
      }

      params.page = nextPage;
      params.size = PAGE_SIZE;

      const response = await api.get<ReportResponse>(selectedConfig.endpoint, { params });
      setReport(response.data);
      setPage(nextPage);
    } catch (err) {
      setReport(null);
      setError(getFriendlyErrorMessage(mapApiError(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Wallet[]>("/wallets").then((response) => setWallets(response.data)).catch(() => setWallets([]));
  }, []);

  useEffect(() => {
    const nextFilters = {
      ...DEFAULT_FILTERS,
      walletId: filters.walletId,
    };
    setFilters(nextFilters);
    setReport(null);
    setError("");
    void fetchReport(0, nextFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport]);

  const columns = useMemo(() => {
    const allColumns = (() => {
    if ((report?.columns?.length ?? 0) > 0) {
      return report?.columns ?? [];
    }

    if (isObjectData(report?.data)) {
      return Object.keys(report.data).map((key) => ({ key }));
    }

    const rows = Array.isArray(report?.data)
      ? report.data
      : isPaginatedData(report?.data)
        ? report.data.content
        : [];

      return Object.keys(rows[0] ?? {}).map((key) => ({ key }));
    })();

    const accessors = allColumns.map((column) => getColumnAccessor(column));
    const hiddenColumns = new Set(REPORT_HIDDEN_COLUMNS[selectedReport] ?? []);

    return allColumns.filter((column) => {
      const accessor = getColumnAccessor(column);
      return !hiddenColumns.has(accessor) && !shouldHideColumnAccessor(accessor, accessors);
    });
  }, [report, selectedReport]);
  const paginatedData = isPaginatedData(report?.data) ? report.data : null;
  const arrayData = Array.isArray(report?.data) ? report.data : paginatedData?.content ?? [];
  const objectData = isObjectData(report?.data) ? report.data : null;
  const objectEntries = objectData
    ? (columns.length > 0
        ? columns.map((column) => [getColumnAccessor(column), objectData[getColumnAccessor(column)]])
        : Object.entries(objectData))
    : [];
  const totalPages = paginatedData?.totalPages ?? 0;
  const totalElements = paginatedData?.totalElements ?? arrayData.length;
  const hasExportableReport = Boolean(report && (objectEntries.length > 0 || arrayData.length > 0));

  const handleExportExcel = async () => {
    if (!report) {
      return;
    }

    setExportLoading(true);

    try {
      const XLSX = await import("xlsx");
    const reportTitle = report.titleKey ? t(report.titleKey) : t(selectedConfig.labelKey);
    const worksheetName = reportTitle.slice(0, 31) || "Report";
    const rows = buildExportRows(report, columns, objectEntries, t);

    if (rows.length === 0) {
        return;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

      const today = new Date().toISOString().slice(0, 10);
      const fileName = `${toSafeFileName(reportTitle) || "report"}_${today}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) {
      return;
    }

    setExportLoading(true);

    try {
    const reportTitle = report.titleKey ? t(report.titleKey) : t(selectedConfig.labelKey);
    const rows = buildExportRows(report, columns, objectEntries, t);

    if (rows.length === 0) {
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const today = new Date().toISOString().slice(0, 10);
      const isArabic = isArabicLanguage(i18n.language);

      if (isArabic) {
        const { default: html2canvas } = await import("html2canvas");
        const snapshotElement = buildPdfSnapshotElement({
          title: reportTitle,
          generatedDateLabel: t("reports.export.generatedDate"),
          generatedDateValue: today,
          rows: rows.map((row) =>
            Object.fromEntries(
              Object.entries(row).map(([key, value]) => [key, formatValue(value, i18n.language, t)]),
            ),
          ),
          rtl: true,
        });

        document.body.appendChild(snapshotElement);

        try {
          if ("fonts" in document) {
            await document.fonts.ready;
          }

          const canvas = await html2canvas(snapshotElement, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          });

          const doc = new jsPDF({
            orientation: columns.length > 5 ? "landscape" : "portrait",
            unit: "pt",
            format: "a4",
          });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 24;
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;
          const imageData = canvas.toDataURL("image/png");
          const imageWidth = availableWidth;
          const imageHeight = (canvas.height * imageWidth) / canvas.width;
          let remainingHeight = imageHeight;
          let offsetY = margin;

          doc.addImage(imageData, "PNG", margin, offsetY, imageWidth, imageHeight, undefined, "FAST");
          remainingHeight -= availableHeight;

          while (remainingHeight > 0) {
            doc.addPage();
            offsetY = margin - (imageHeight - remainingHeight);
            doc.addImage(imageData, "PNG", margin, offsetY, imageWidth, imageHeight, undefined, "FAST");
            remainingHeight -= availableHeight;
          }

          const fileName = `${toSafeFileName(reportTitle) || "report"}_${today}.pdf`;
          doc.save(fileName);
        } finally {
          snapshotElement.remove();
        }

        return;
      }

      const { default: autoTable } = await import("jspdf-autotable");
      const headers = Object.keys(rows[0] ?? {});
      const body = rows.map((row) => headers.map((header) => formatValue(row[header], i18n.language, t)));
      const doc = new jsPDF({
        orientation: headers.length > 5 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(16);
      doc.text(reportTitle, 40, 40);
      doc.setFontSize(10);
      doc.text(`${t("reports.export.generatedDate")}: ${today}`, 40, 60);

      autoTable(doc, {
        head: [headers],
        body,
        startY: 80,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 20,
        },
      });

      const fileName = `${toSafeFileName(reportTitle) || "report"}_${today}.pdf`;
      doc.save(fileName);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <DashboardLayout title={t("tabs.reports")}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("reports.runnerTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void fetchReport(0, filters);
              }}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>{t("reports.fields.report")}</Label>
                  <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value as ReportId)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("reports.fields.report")} />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_CONFIGS.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {t(config.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {visibleFilters.has("fromDate") && (
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">{t("reports.fields.fromDate")}</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={filters.fromDate}
                      onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
                    />
                  </div>
                )}

                {visibleFilters.has("toDate") && (
                  <div className="space-y-2">
                    <Label htmlFor="toDate">{t("reports.fields.toDate")}</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={filters.toDate}
                      onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
                    />
                  </div>
                )}

                {visibleFilters.has("walletId") && (
                  <div className="space-y-2">
                    <Label>{t("reports.fields.walletId")}</Label>
                    <Select
                      value={filters.walletId}
                      onValueChange={(value) => setFilters((current) => ({ ...current, walletId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.selectWallet")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.allWallets")}</SelectItem>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {visibleFilters.has("type") && (
                  <div className="space-y-2">
                    <Label>{t("reports.fields.type")}</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters((current) => ({ ...current, type: value as TransactionType | "all" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                        <SelectItem value="CREDIT">{t("transactions.credit")}</SelectItem>
                        <SelectItem value="DEBIT">{t("transactions.debit")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {visibleFilters.has("active") && (
                  <div className="space-y-2">
                    <Label>{t("reports.fields.active")}</Label>
                    <Select
                      value={filters.active}
                      onValueChange={(value) => setFilters((current) => ({ ...current, active: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("reports.fields.active")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="true">{t("common.active")}</SelectItem>
                        <SelectItem value="false">{t("common.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {visibleFilters.has("period") && (
                  <div className="space-y-2">
                    <Label>{t("reports.fields.period")}</Label>
                    <Select
                      value={filters.period}
                      onValueChange={(value) => setFilters((current) => ({ ...current, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("reports.fields.period")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {t(`reports.periods.${option.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || exportLoading || !hasExportableReport}
                  onClick={handleExportPdf}
                  className="me-2"
                >
                  {t("reports.actions.exportPdf")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || exportLoading || !hasExportableReport}
                  onClick={handleExportExcel}
                  className="me-2"
                >
                  {t("reports.actions.exportExcel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t("reports.actions.running") : t("reports.actions.run")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t("reports.states.errorTitle")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {report?.titleKey ? t(report.titleKey) : t(selectedConfig.labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            )}

            {!loading && !error && !report && (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("reports.states.idle")}
              </div>
            )}

            {!loading && !error && report && objectData && objectEntries.length === 0 && (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("reports.states.empty")}
              </div>
            )}

            {!loading && !error && report && objectData && objectEntries.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {objectEntries.map(([key, value], index) => {
                  const column = columns[index];
                  const label = column
                    ? getColumnLabel(column, t)
                    : translateOrFallback(t, `reports.fields.${String(key)}`, String(key));

                  return (
                    <Card key={String(key)} className="shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">
                          {formatValue(value, i18n.language, t)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && !error && report && !objectData && arrayData.length === 0 && (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                {t("reports.states.empty")}
              </div>
            )}

            {!loading && !error && report && !objectData && arrayData.length > 0 && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column, index) => (
                        <TableHead key={`${getColumnAccessor(column)}-${index}`}>
                          {getColumnLabel(column, t)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrayData.map((row, rowIndex) => (
                      <TableRow key={String(row.id ?? rowIndex)}>
                        {columns.map((column, columnIndex) => {
                          const accessor = getColumnAccessor(column);
                          return (
                            <TableCell key={`${accessor}-${columnIndex}`}>
                              {formatValue(row[accessor], i18n.language, t)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {paginatedData && totalPages > 1 && (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("reports.pagination.summary", {
                        current: page + 1,
                        total: totalPages,
                        count: totalElements,
                      })}
                    </p>
                    <Pagination className="mx-0 w-auto justify-start md:justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            aria-disabled={page === 0}
                            className={page === 0 ? "pointer-events-none opacity-50" : ""}
                            onClick={(event) => {
                              event.preventDefault();
                              if (page > 0) {
                                void fetchReport(page - 1);
                              }
                            }}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, index) => index).slice(
                          Math.max(0, page - 1),
                          Math.min(totalPages, page + 2),
                        ).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === page}
                              onClick={(event) => {
                                event.preventDefault();
                                void fetchReport(pageNumber);
                              }}
                            >
                              {pageNumber + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            aria-disabled={page >= totalPages - 1}
                            className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                            onClick={(event) => {
                              event.preventDefault();
                              if (page < totalPages - 1) {
                                void fetchReport(page + 1);
                              }
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
