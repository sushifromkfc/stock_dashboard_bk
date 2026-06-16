"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Stock } from "@/types/stock";
import { formatNumber } from "@/lib/format";

const SECTOR_COLORS: Record<string, string> = {
  Technology: "bg-blue-100 text-blue-800",
  "Communication Services": "bg-purple-100 text-purple-800",
  "Consumer Discretionary": "bg-orange-100 text-orange-800",
  "Consumer Staples": "bg-green-100 text-green-800",
  Energy: "bg-yellow-100 text-yellow-800",
  Financials: "bg-cyan-100 text-cyan-800",
  "Health Care": "bg-pink-100 text-pink-800",
  Industrials: "bg-gray-100 text-gray-800",
  Materials: "bg-lime-100 text-lime-800",
  "Real Estate": "bg-red-100 text-red-800",
  Utilities: "bg-teal-100 text-teal-800",
};

function MetricCell({ value }: { value: number | null | undefined }) {
  const formatted = formatNumber(value);
  const isNegative = value !== null && value !== undefined && value < 0;
  return (
    <span className={isNegative ? "text-red-500" : "text-gray-900"}>
      {formatted}
    </span>
  );
}

const columns: ColumnDef<Stock>[] = [
  {
    id: "name_kr",
    header: "회사명",
    accessorFn: (row) => row.name_kr,
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.name_kr}</div>
        <div className="text-xs text-gray-400">{row.original.name_en}</div>
      </div>
    ),
  },
  {
    id: "ticker",
    header: "티커",
    accessorFn: (row) => row.ticker,
    cell: ({ getValue }) => (
      <span className="font-mono font-semibold text-gray-700">
        {getValue() as string}
      </span>
    ),
  },
  {
    id: "sector",
    header: "섹터",
    accessorFn: (row) => row.sector,
    cell: ({ getValue }) => {
      const sector = getValue() as string;
      const colorClass =
        SECTOR_COLORS[sector] ?? "bg-gray-100 text-gray-800";
      return (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
        >
          {sector}
        </span>
      );
    },
  },
  {
    id: "ebit_ttm",
    header: "EBIT (Annual)",
    accessorFn: (row) => row.metrics?.ebit_ttm ?? null,
    sortUndefined: "last",
    cell: ({ getValue }) => <MetricCell value={getValue() as number | null} />,
  },
  {
    id: "working_capital",
    header: "Working Capital",
    accessorFn: (row) => row.metrics?.working_capital ?? null,
    sortUndefined: "last",
    cell: ({ getValue }) => <MetricCell value={getValue() as number | null} />,
  },
  {
    id: "net_ppe",
    header: "Net PP&E",
    accessorFn: (row) => row.metrics?.net_ppe ?? null,
    sortUndefined: "last",
    cell: ({ getValue }) => <MetricCell value={getValue() as number | null} />,
  },
  {
    id: "total_debt",
    header: "Total Debt",
    accessorFn: (row) => row.metrics?.total_debt ?? null,
    sortUndefined: "last",
    cell: ({ getValue }) => <MetricCell value={getValue() as number | null} />,
  },
  {
    id: "market_cap",
    header: "Market Cap",
    accessorFn: (row) => row.metrics?.market_cap ?? null,
    sortUndefined: "last",
    cell: ({ getValue }) => <MetricCell value={getValue() as number | null} />,
  },
];

interface Props {
  data: Stock[];
  globalFilter: string;
  sectorFilter: string;
  onDeleted: (ticker: string) => void;
}

export default function StockTable({ data, globalFilter, sectorFilter, onDeleted }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "market_cap", desc: true }]);
  const [deletingTicker, setDeletingTicker] = useState<string | null>(null);

  async function handleDelete(ticker: string) {
    if (!confirm(`${ticker} 종목을 삭제할까요?`)) return;
    setDeletingTicker(ticker);
    try {
      await fetch(`/api/stocks/${ticker}`, { method: "DELETE" });
      onDeleted(ticker);
    } finally {
      setDeletingTicker(null);
    }
  }

  const allColumns: ColumnDef<Stock>[] = [
    ...columns,
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => handleDelete(row.original.ticker)}
          disabled={deletingTicker === row.original.ticker}
          className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 text-base leading-none px-1"
          title="삭제"
        >
          ×
        </button>
      ),
    },
  ];

  const filtered = sectorFilter
    ? data.filter((s) => s.sector === sectorFilter)
    : data;

  const table = useReactTable({
    data: filtered,
    columns: allColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none"
                  style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className="text-gray-300">
                        {header.column.getIsSorted() === "asc"
                          ? "↑"
                          : header.column.getIsSorted() === "desc"
                          ? "↓"
                          : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={allColumns.length} className="px-4 py-12 text-center text-gray-400">
                검색 결과가 없습니다.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
        {table.getRowModel().rows.length}개 종목
      </div>
    </div>
  );
}
