
"use client";

import instance from "@/lib/axios";
import {
  Check,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
} from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getQueryStateKey,
  isReturningToPath,
  loadNavigationState,
  parseQueryState,
  saveNavigationState,
  writeQueryState,
} from "@/utils/navigationState";

const getColumnWidths = (data: Record<string, unknown>[]) => {
  const keys = Object.keys(data[0] || {});

  return keys.map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length),
    );

    return { wch: maxLength + 5 };
  });
};

export type Column<T> = {
  key: keyof T | string;
  header: string;
  headerAction?: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  exportValue?: (row: T, index: number) => string | number | null | undefined;
  isImage?: boolean;
  width?: string;
  className?: string;
  printable?: boolean;
  truncateWords?: number;
  filterable?: boolean;
  filterDependsOn?: string;
  showTotal?: boolean;
  totalValue?: (rows: T[]) => number;
};

type TableProps<T> = {
  printContent?: React.ReactNode;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  onRowClickAction?: (row: T) => void;
  getRowKeyAction: (row: T, index: number) => string | number;
  tableClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  headerClassName?: string;
  filterStateId?: string;
  exportTitle?: string;
  excelImportType?: string;
  excelImportExtraFields?: Record<
    string,
    string | number | boolean | null | undefined
  >;
  onExcelImportSuccess?: () => void | Promise<void>;
  onFilteredDataChange?: (data: T[]) => void;
  filterContent?: React.ReactNode;
  fillViewport?: boolean;
  viewportFooterRef?: React.RefObject<HTMLElement | null>;
  excelTemplateColumns?: {
    header: string;
    condition?: string;
  }[];
};

export default function Table<T>({
  data,
  columns,
  excelTemplateColumns = [],
  loading,
  emptyText = "لا توجد بيانات",
  onRowClickAction,
  getRowKeyAction,
  tableClassName = "",
  rowClassName = "",
  cellClassName = "",
  headerClassName = "",
  filterStateId,
  exportTitle = "تقرير الجدول",
  excelImportType,
  excelImportExtraFields,
  onExcelImportSuccess,
  onFilteredDataChange,
  filterContent,
  fillViewport = false,
  viewportFooterRef,
  printContent,
}: TableProps<T>) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const tableStateId =
    filterStateId ??
    `${exportTitle}|${columns
      .map((column) => `${String(column.key)}:${column.header}`)
      .join("|")}|${getRowKeyAction.toString()}`;
  const filterQueryKey = getQueryStateKey("tableFilters", tableStateId);
  const serializedFilterState = searchParams.get(filterQueryKey);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const pinnedColumnWidthsRef = useRef<Record<string, number> | null>(null);
  const skipFilterSaveRef = useRef(true);

  const [importing, setImporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const columnFiltersRef = useRef(columnFilters);
  columnFiltersRef.current = columnFilters;
  const [restoreTableScrollTop, setRestoreTableScrollTop] = useState<number | null>(
    null,
  );
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDropdownPosition, setFilterDropdownPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  }>({ left: 0 });

  useEffect(() => {
    skipFilterSaveRef.current = true;

    const savedState = loadNavigationState<{
      pinnedColumnWidths?: Record<string, number> | null;
      scrollTop?: number;
    }>("table-filters", pathname, tableStateId);

    if (
      isReturningToPath(pathname) &&
      typeof savedState?.scrollTop === "number" &&
      Number.isFinite(savedState.scrollTop)
    ) {
      setRestoreTableScrollTop(savedState.scrollTop);
    }
  }, [pathname, tableStateId]);

  useEffect(() => {
    const queryFilters = parseQueryState<Record<string, string[]>>(
      serializedFilterState,
    );
    const nextFilters = queryFilters ?? {};

    if (JSON.stringify(columnFiltersRef.current) === JSON.stringify(nextFilters)) {
      return;
    }

    setColumnFilters(nextFilters);
  }, [serializedFilterState]);

  useEffect(() => {
    if (skipFilterSaveRef.current) {
      skipFilterSaveRef.current = false;
      return;
    }

    const hasFilters = Object.values(columnFilters).some(
      (values) => values.length > 0,
    );
    writeQueryState(filterQueryKey, hasFilters ? columnFilters : null);

    saveNavigationState(
      "table-filters",
      pathname,
      {
        pinnedColumnWidths: pinnedColumnWidthsRef.current,
        scrollTop: scrollAreaRef.current?.scrollTop ?? 0,
      },
      tableStateId,
    );
  }, [columnFilters, filterQueryKey, pathname, tableStateId]);

  useEffect(() => {
    if (!fillViewport) return;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    let frame: number | null = null;
    const saveScrollPosition = () => {
      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;
        saveNavigationState(
          "table-filters",
          pathname,
          {
            pinnedColumnWidths: pinnedColumnWidthsRef.current,
            scrollTop: scrollArea.scrollTop,
          },
          tableStateId,
        );
      });
    };

    scrollArea.addEventListener("scroll", saveScrollPosition, {
      passive: true,
    });

    return () => {
      scrollArea.removeEventListener("scroll", saveScrollPosition);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [fillViewport, pathname, tableStateId]);

  useLayoutEffect(() => {
    if (restoreTableScrollTop === null) return;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    let frame = 0;
    let attempts = 0;
    const restoreScrollPosition = () => {
      const canReachPosition =
        scrollArea.scrollHeight >=
        restoreTableScrollTop + scrollArea.clientHeight;

      if (!canReachPosition && attempts < 180) {
        attempts += 1;
        frame = requestAnimationFrame(restoreScrollPosition);
        return;
      }

      scrollArea.scrollTop = restoreTableScrollTop;
      setRestoreTableScrollTop(null);
    };

    frame = requestAnimationFrame(restoreScrollPosition);
    return () => cancelAnimationFrame(frame);
  }, [data.length, restoreTableScrollTop]);

  const updateFilterDropdownPosition = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 8;
    const dropdownEstimatedHeight = 360;
    const dropdownWidth = Math.min(288, window.innerWidth * 0.85);

    let left = rect.left;

    if (left + dropdownWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - dropdownWidth - viewportPadding;
    }

    if (left < viewportPadding) left = viewportPadding;

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    const openUpward =
      spaceBelow < dropdownEstimatedHeight && spaceAbove > spaceBelow;

    if (openUpward) {
      setFilterDropdownPosition({
        bottom: window.innerHeight - rect.top + gap,
        left,
      });
    } else {
      setFilterDropdownPosition({
        top: rect.bottom + gap,
        left,
      });
    }
  };

  const reactNodeToText = (node: React.ReactNode): string => {
    if (node === null || node === undefined) return "";

    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map(reactNodeToText).join("");
    }

    if (React.isValidElement(node)) {
      return reactNodeToText(
        (node.props as { children?: React.ReactNode }).children,
      );
    }

    return "";
  };

  const getFilterValue = (row: T, col: Column<T>, index: number) => {
    if (col.render) {
      return reactNodeToText(col.render(row, index)).trim();
    }

    const value = row[col.key as keyof T];

    return String(value ?? "").trim();
  };

  // Cache filter values and unique options whenever data or columns change.
  // Opening/closing a dropdown no longer recalculates values for every row.
  const { filterValuesByColumn, uniqueFilterValues } = useMemo(() => {
    const valuesByColumn: Record<string, string[]> = {};
    const uniqueValues: Record<string, string[]> = {};

    columns.forEach((col) => {
      if (!col.filterable) return;

      const key = String(col.key);
      const values = data.map((row, index) =>
        getFilterValue(row, col, index),
      );

      valuesByColumn[key] = values;
      uniqueValues[key] = [
        ...new Set(values.filter((value) => value.length > 0)),
      ];
    });

    return {
      filterValuesByColumn: valuesByColumn,
      uniqueFilterValues: uniqueValues,
    };
  }, [data, columns]);

  const filterOptionsByColumn = useMemo(() => {
    const optionsByColumn = { ...uniqueFilterValues };

    columns.forEach((col) => {
      if (!col.filterable || !col.filterDependsOn) return;

      const key = String(col.key);
      const parentKey = String(col.filterDependsOn);
      const selectedParentValues = columnFilters[parentKey] ?? [];
      const parentValues = filterValuesByColumn[parentKey];
      const values = filterValuesByColumn[key];

      if (selectedParentValues.length === 0 || !parentValues || !values) {
        return;
      }

      optionsByColumn[key] = [
        ...new Set(
          values.filter(
            (value, index) =>
              value.length > 0 &&
              selectedParentValues.includes(parentValues[index]),
          ),
        ),
      ];
    });

    return optionsByColumn;
  }, [columnFilters, columns, filterValuesByColumn, uniqueFilterValues]);

  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(
      ([, values]) => values.length > 0,
    );

    if (activeFilters.length === 0) return data;

    const activeColumnFilters = activeFilters.map(([key, selected]) => ({
      values: filterValuesByColumn[key],
      selected,
    }));

    return data.filter((_, rowIndex) =>
      activeColumnFilters.every(
        ({ values, selected }) =>
          !values || selected.includes(values[rowIndex]),
      ),
    );
  }, [columnFilters, data, filterValuesByColumn]);

  const totalColumns = useMemo(
    () => columns.filter((col) => col.showTotal),
    [columns],
  );

  const getColumnTotal = (col: Column<T>) => {
    if (col.totalValue) {
      return col.totalValue(filteredData);
    }

    return filteredData.reduce((total, row) => {
      const value = row[col.key as keyof T];

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        typeof value === "boolean"
      ) {
        return total;
      }

      const numberValue =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : NaN;

      return Number.isFinite(numberValue) ? total + numberValue : total;
    }, 0);
  };

  const lastNotifiedFilteredDataRef = useRef<T[] | null>(null);

  useEffect(() => {
    if (!onFilteredDataChange) return;

    const previousData = lastNotifiedFilteredDataRef.current;
    const hasSameRows =
      previousData !== null &&
      previousData.length === filteredData.length &&
      previousData.every((row, index) => row === filteredData[index]);

    if (hasSameRows) return;

    lastNotifiedFilteredDataRef.current = filteredData;
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  useEffect(() => {
    if (!openFilterColumn) return;

    const handlePointerDown = (event: PointerEvent) => {
      const isFilterTrigger =
        event.target instanceof Element &&
        event.target.closest("[data-column-filter-trigger]");

      if (
        event.target instanceof Node &&
        !filterDropdownRef.current?.contains(event.target) &&
        !isFilterTrigger
      ) {
        setOpenFilterColumn(null);
        setFilterSearch("");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFilterColumn(null);
        setFilterSearch("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openFilterColumn]);

  useEffect(() => {
    if (!openFilterColumn) return;

    const handleScroll = (event: Event) => {
      const target = event.target;

      if (
        target instanceof Node &&
        filterDropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpenFilterColumn(null);
      setFilterSearch("");
    };

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openFilterColumn]);

  const handleColumnFilterChange = (key: string, value: string) => {
    const hasActiveFilters = Object.values(columnFilters).some(
      (values) => values.length > 0,
    );
    const nextFilters = { ...columnFilters };

    if (!value) {
      delete nextFilters[key];
    } else {
      const currentValues = columnFilters[key] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      if (nextValues.length === 0) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = nextValues;
      }
    }

    columns.forEach((col) => {
      if (String(col.filterDependsOn) === key) {
        delete nextFilters[String(col.key)];
      }
    });

    const hasNextActiveFilters = Object.values(nextFilters).some(
      (values) => values.length > 0,
    );

    if (!hasActiveFilters && hasNextActiveFilters) {
      const headerCells = tableRef.current?.querySelectorAll("thead th");
      pinnedColumnWidthsRef.current = headerCells
        ? Object.fromEntries(
          Array.from(headerCells, (header, index) => [
            String(columns[index].key),
            header.getBoundingClientRect().width,
          ]),
        )
        : null;
    } else if (!hasNextActiveFilters) {
      pinnedColumnWidthsRef.current = null;
    }

    setColumnFilters(nextFilters);
  };

  useLayoutEffect(() => {
    if (!fillViewport) return;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    let frame = 0;

    const updateHeight = () => {
      const top = scrollArea.getBoundingClientRect().top;

      const footerHeight =
        viewportFooterRef?.current?.getBoundingClientRect().height ?? 0;

      const gap = viewportFooterRef?.current ? 16 : 0;

      const height = Math.max(
        300,
        Math.floor(window.innerHeight - Math.max(top, 0) - footerHeight - gap),
      );

      scrollArea.style.setProperty("--table-viewport-height", `${height}px`);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateHeight);
    };

    const observer = new ResizeObserver(scheduleUpdate);

    observer.observe(scrollArea);

    if (viewportFooterRef?.current) {
      observer.observe(viewportFooterRef.current);
    }

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });

    updateHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      cancelAnimationFrame(frame);
      scrollArea.style.removeProperty("--table-viewport-height");
    };
  }, [fillViewport, viewportFooterRef]);

  const exportColumns = columns.filter(
    (col) => col.printable !== false && col.key !== "actions",
  );

  const primaryNameColumnIndex = columns.findIndex((column) => {
    const key = String(column.key).toLowerCase();
    const header = column.header.trim();

    return key === "name" || header === "الاسم" || header.startsWith("اسم ");
  });

  const getCellValue = (row: T, col: Column<T>, index: number) => {
    if (col.exportValue) return col.exportValue(row, index) ?? "";

    if (col.render && !col.isImage) {
      return reactNodeToText(col.render(row, index));
    }

    const value = row[col.key as keyof T];

    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "نعم" : "لا";

    if (typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      const label = objectValue.name ?? objectValue.value ?? objectValue.label;

      if (
        typeof label === "string" ||
        typeof label === "number" ||
        typeof label === "boolean"
      ) {
        return label;
      }
    }

    return "";
  };

  const renderDefaultCellValue = (row: T, col: Column<T>) => {
    const rawValue = row[col.key as keyof T];
    const value = String(rawValue ?? "-");

    if (!col.truncateWords || rawValue === null || rawValue === undefined) {
      return value;
    }

    const words = value.trim().split(/\s+/);
    const isTruncated = words.length > col.truncateWords;
    const visibleValue = isTruncated
      ? `${words.slice(0, col.truncateWords).join(" ")}...`
      : value;

    return (
      <span
        title={isTruncated ? value : undefined}
        className="block cursor-help wrap-break-word"
      >
        {visibleValue}
      </span>
    );
  };

  const escapeHtml = (value: unknown) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildTableHtml = () => `
    <table>
      <thead>
        <tr>
          ${exportColumns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${filteredData
      .map(
        (row, rowIndex) => `
              <tr>
                ${exportColumns
            .map((col) => {
              const value = getCellValue(row, col, rowIndex);

              if (col.isImage) {
                const imgSrc = String(value || "");

                return `
                        <td>
                          <img
                            src="${imgSrc}"
                            style="width:60px;height:60px;object-fit:cover;border-radius:6px;"
                            crossorigin="anonymous"
                          />
                        </td>
                      `;
              }

              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
              </tr>
            `,
      )
      .join("")}
      </tbody>
    </table>
  `;

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(exportTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(exportTitle)}</h2>
          ${buildTableHtml()}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((row, rowIndex) => {
      const obj: Record<string, string | number | boolean> = {};

      exportColumns.forEach((col) => {
        obj[col.header] = getCellValue(row, col, rowIndex);
      });

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = getColumnWidths(exportData);

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };

    XLSX.utils.book_append_sheet(workbook, worksheet, exportTitle || "Sheet1");
    XLSX.writeFile(workbook, `${exportTitle}.xlsx`);
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !excelImportType) return;

    const formData = new FormData();
    formData.append("excelFile", file);
    formData.append("type", excelImportType);

    Object.entries(excelImportExtraFields || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, String(value));
      }
    });

    try {
      setImporting(true);

      await instance.post("ExcelImport", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم استيراد ملف Excel بنجاح");
      await onExcelImportSuccess?.();
    } catch (error) {
      console.log(error);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      excelTemplateColumns.map((column) => column.header),
      excelTemplateColumns.map((column) => column.condition ?? ""),
    ]);

    worksheet["!cols"] = excelTemplateColumns.map((column) => ({
      wch: Math.max(
        column.header.length + 5,
        (column.condition?.length ?? 0) + 5,
        15,
      ),
    }));

    worksheet["!rows"] = [{ hpt: 25 }, { hpt: 40 }];

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };

    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${excelImportType}Template.xlsx`);
  };

  // Memoize the table body so toggling a filter dropdown does not rebuild
  // every table row when the actual displayed data has not changed.
  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length} className="p-6 text-center">
            جاري التحميل...
          </td>
        </tr>
      );
    }

    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="p-6 text-center">
            {emptyText}
          </td>
        </tr>
      );
    }

    return filteredData.map((row, rowIndex) => (
      <tr
        key={getRowKeyAction(row, rowIndex)}
        onClick={() => onRowClickAction?.(row)}
        className={`
          ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-100"}
          ${onRowClickAction ? "hover:bg-gray-200 cursor-pointer" : ""}
          transition
          ${rowClassName}
        `}
      >
        {columns.map((col, colIndex) => (
          <td
            key={String(col.key)}
            style={{
              width: pinnedColumnWidthsRef.current?.[String(col.key)],
            }}
            className={`
              p-1 align-top border border-gray-200
              ${colIndex === primaryNameColumnIndex ? "whitespace-normal wrap-break-word!" : "whitespace-nowrap"}
              ${colIndex !== columns.length - 1 ? "border-r border-gray-200" : ""}
              ${col.className || ""}
              ${cellClassName}
            `}
          >
            {col.render
              ? col.render(row, rowIndex)
              : renderDefaultCellValue(row, col)}
          </td>
        ))}
      </tr>
    ));
  }, [
    loading,
    columns,
    filteredData,
    emptyText,
    getRowKeyAction,
    onRowClickAction,
    rowClassName,
    cellClassName,
    primaryNameColumnIndex,
  ]);

  return (
    <div ref={containerRef} className="space-y-3">
      {(data.length > 0 ||
        excelImportType ||
        filterContent ||
        Object.keys(columnFilters).length > 0) && (
          <div className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {printContent ? printContent : <span />}

              <div className="flex flex-wrap justify-end gap-1.5">
                {Object.keys(columnFilters).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      pinnedColumnWidthsRef.current = null;
                      setColumnFilters({});
                      setOpenFilterColumn(null);
                      setFilterSearch("");
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-main transition hover:bg-gray-50"
                  >
                    مسح الفلاتر
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={filteredData.length === 0}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs transition hover:bg-gray-200"
                >
                  <FileText size={14} />
                  PDF
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={filteredData.length === 0}
                  className="flex items-center gap-1 rounded-md border border-green-600 bg-white px-2 py-1 text-xs text-green-700 transition hover:bg-green-50"
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </button>

                {excelImportType && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleImportExcel}
                    />

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1 rounded-md border border-blue-600 bg-white px-2 py-1 text-xs text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download size={14} />
                      تحميل Template
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="flex items-center gap-1 rounded-md border border-blue-600 bg-white px-2 py-1 text-xs text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload size={14} />
                      {importing ? "جاري الاستيراد..." : "استيراد Excel"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {filterContent && isFilterOpen && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                {filterContent}
              </div>
            )}
          </div>
        )}

      <div
        ref={scrollAreaRef}
        className={`${fillViewport ? "max-h-[calc(100dvh-12rem)] overflow-auto" : ""
          } relative w-full rounded-xl border border-gray-200 bg-white shadow-sm`}
      >
        <table
          ref={tableRef}
          className={`
            min-w-full w-full table-auto text-right border-collapse
            ${tableClassName}
          `}
        >
          {pinnedColumnWidthsRef.current && (
            <colgroup>
              {columns.map((col) => (
                <col
                  key={String(col.key)}
                  style={{
                    width: `${pinnedColumnWidthsRef.current?.[String(col.key)]}px`,
                  }}
                />
              ))}
            </colgroup>
          )}
          <thead
            className={`
              text-gray-700 text-sm
              ${headerClassName}
            `}
          >
            <tr>
              {columns.map((col, colIndex) => (
                <th
                  key={String(col.key)}
                  style={{
                    width:
                      pinnedColumnWidthsRef.current?.[String(col.key)] ??
                      col.width ??
                      (colIndex === primaryNameColumnIndex
                        ? "100%"
                        : undefined),
                  }}
                  className={`
                    sticky top-0
                    ${openFilterColumn === String(col.key) ? "z-40" : "z-20"}
                    bg-gray-200 px-1 border-b border-gray-300
                    shadow-[0_2px_0_rgba(209,213,219,0.9)]
                    ${colIndex === primaryNameColumnIndex
                      ? "whitespace-normal wrap-break-word!"
                      : "whitespace-nowrap"
                    }
                    ${col.className || ""}
                    ${colIndex !== columns.length - 1 ? "border-r border-gray-300" : "border-r"}
                  `}
                >
                  <div
                    className={`flex items-center justify-between gap-2 font-bold text-gray-700 ${col.filterable || col.headerAction ? "" : "py-1"
                      }`}
                  >
                    <span className="min-w-0">{col.header}</span>

                    {(col.headerAction || col.filterable) && (
                      <div className="flex shrink-0 items-center gap-1">
                        {col.headerAction}

                        {col.filterable && (
                          <button
                            type="button"
                            data-column-filter-trigger
                            aria-label={`فلترة ${col.header}`}
                            aria-expanded={openFilterColumn === String(col.key)}
                            onClick={(event) => {
                              event.stopPropagation();

                              const button = event.currentTarget;
                              const key = String(col.key);

                              if (openFilterColumn === key) {
                                setOpenFilterColumn(null);
                                setFilterSearch("");
                                return;
                              }

                              updateFilterDropdownPosition(button);
                              setOpenFilterColumn(key);
                              setFilterSearch("");
                            }}
                            className={`
                              relative !h-7 !w-7 !min-h-0 !min-w-0 !p-0
                              !shrink-0 !flex-none !m-0.5
                              flex items-center justify-center
                              rounded-lg border transition-all
                              ${columnFilters[String(col.key)]?.length
                                ? "border-main/30 bg-main/10 text-main"
                                : "border-gray-300 bg-white text-gray-500 hover:border-main/30 hover:bg-white hover:text-main"
                              }
                            `}
                          >
                            <ChevronDown
                              size={15}
                              strokeWidth={2.2}
                              className={`transition-transform duration-200 ${openFilterColumn === String(col.key)
                                ? "rotate-180"
                                : ""
                                }`}
                            />

                            {columnFilters[String(col.key)]?.length > 0 && (
                              <span
                                aria-label="يوجد فلتر مفعّل"
                                className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-gray-200 bg-main"
                              >
                                <Check size={8} strokeWidth={3} className="text-white" />
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {col.filterable &&
                    openFilterColumn === String(col.key) &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        ref={filterDropdownRef}
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          position: "fixed",
                          left: filterDropdownPosition.left,
                          ...(filterDropdownPosition.top !== undefined
                            ? { top: filterDropdownPosition.top }
                            : { bottom: filterDropdownPosition.bottom }),
                        }}
                        className="z-[9999] w-72 max-w-[85vw] overflow-hidden rounded-2xl border border-rose-100 bg-white text-right text-sm font-normal text-gray-800 shadow-xl shadow-rose-900/15"
                      >
                        <div className="border-b border-rose-100 bg-rose-50/40 p-2.5">
                          <input
                            type="search"
                            value={filterSearch}
                            onChange={(event) =>
                              setFilterSearch(event.target.value)
                            }
                            placeholder="ابحث داخل القيم"
                            aria-label={`البحث في قيم ${col.header}`}
                            className="h-12 w-full rounded-xl border border-rose-100 bg-white px-3 text-base outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                          />
                        </div>

                        <div className="hide-scrollbar max-h-64 overflow-y-auto p-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleColumnFilterChange(String(col.key), "")
                            }
                            className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-right text-base font-medium transition ${!columnFilters[String(col.key)]?.length
                              ? "border-rose-200 bg-rose-50 text-main"
                              : "border-transparent bg-gray-50 text-gray-700 hover:border-rose-100 hover:bg-rose-50"
                              }`}
                          >
                            <span>الكل</span>

                            {!columnFilters[String(col.key)]?.length && (
                              <span className="flex size-5 items-center justify-center rounded-full bg-main/10">
                                <Check size={14} className="text-main" />
                              </span>
                            )}
                          </button>

                          {(filterOptionsByColumn[String(col.key)] || [])
                            .filter((value) =>
                              value
                                .toLowerCase()
                                .includes(filterSearch.toLowerCase()),
                            )
                            .map((value) => {
                              const selectedValues = columnFilters[String(col.key)] ?? [];
                              const isSelected = selectedValues.includes(value);

                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    handleColumnFilterChange(String(col.key), value)
                                  }
                                  className={`mb-0.5 flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-right text-base transition ${isSelected
                                    ? "border-rose-200 bg-rose-50 font-medium text-main"
                                    : "border-transparent text-gray-700 hover:border-rose-100 hover:bg-rose-50"
                                    }`}
                                >
                                  <span className="wrap-break-word">{value}</span>

                                  {isSelected && (
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-main/10">
                                      <Check size={14} className="text-main" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>,
                      document.body,
                    )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>{tableBody}</tbody>

          {totalColumns.length > 0 && (
            <tfoot>
              <tr className="bg-[#DCE8C8] font-bold text-gray-800">
                {columns.map((col, colIndex) => (
                  <td
                    key={String(col.key)}
                    style={{
                      width:
                        col.width ??
                        (colIndex === primaryNameColumnIndex
                          ? "100%"
                          : undefined),
                      boxShadow:
                        colIndex !== columns.length - 1
                          ? "inset 0 2px 0 0 #B5CC8E, inset -1px 0 0 0 #C8DBA6, 0 -4px 10px -4px rgba(0,0,0,0.15)"
                          : "inset 0 2px 0 0 #B5CC8E, 0 -4px 10px -4px rgba(0,0,0,0.15)",
                    }}
                    className={`
                      sticky bottom-0 z-20
                      bg-[#DCE8C8] px-1 py-2.5 align-middle
                      whitespace-nowrap text-gray-800
                      ${col.className || ""}
                    `}
                  >
                    {colIndex === 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-main">
                        الإجماليات
                      </span>
                    ) : col.showTotal ? (
                      <span className="font-extrabold text-main tabular-nums">
                        {getColumnTotal(col).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
