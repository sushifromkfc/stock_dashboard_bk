"use client";

import { useState, useEffect, useCallback } from "react";
import StockTable from "@/components/StockTable";
import AddStockModal from "@/components/AddStockModal";
import { Stock } from "@/types/stock";

function exportToExcel(stocks: Stock[]) {
  const headers = ["티커", "한글명", "영문명", "섹터", "거래소", "EBIT", "Working Capital", "Net PP&E", "Total Debt", "Market Cap", "업데이트"];
  const rows = stocks.map((s) => [
    s.ticker,
    s.name_kr ?? "",
    s.name_en ?? "",
    s.sector ?? "",
    s.exchange ?? "",
    s.metrics?.ebit_ttm ?? "",
    s.metrics?.working_capital ?? "",
    s.metrics?.net_ppe ?? "",
    s.metrics?.total_debt ?? "",
    s.metrics?.market_cap ?? "",
    s.metrics?.updated_at?.slice(0, 10) ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stock_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getUniqueSectors(stocks: Stock[]) {
  return [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort() as string[];
}

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      setStocks(data);
    } catch (err) {
      console.error("Failed to fetch stocks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/stocks/refresh-all", { method: "POST" });
      const data = await res.json();
      setRefreshResult({ succeeded: data.succeeded, failed: data.failed });
      await fetchStocks();
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStocks]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const sectors = getUniqueSectors(stocks);
  const lastUpdated = stocks
    .flatMap((s) => (s.metrics?.updated_at ? [s.metrics.updated_at] : []))
    .sort()
    .at(-1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">관심 종목 핵심 재무지표 비교</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                마지막 업데이트: {lastUpdated.slice(0, 10)}
              </span>
            )}
            <button
              onClick={() => exportToExcel(stocks)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              CSV 내보내기
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + 종목 추가
            </button>
            <button
              onClick={fetchStocks}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              새로고침
            </button>
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? "데이터 수집 중..." : "전체 갱신 (Yahoo Finance)"}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{stocks.length}</div>
            <div className="text-xs text-gray-400">관심 종목</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{sectors.length}</div>
            <div className="text-xs text-gray-400">섹터</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {stocks.filter((s) => s.metrics).length}
            </div>
            <div className="text-xs text-gray-400">데이터 수집됨</div>
          </div>
        </div>
      </div>

      {/* Refresh result banner */}
      {refreshResult && (
        <div className={`px-6 py-2 text-xs text-center ${refreshResult.failed > 0 ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-800"}`}>
          갱신 완료: {refreshResult.succeeded}개 성공
          {refreshResult.failed > 0 && `, ${refreshResult.failed}개 실패`}
          <button onClick={() => setRefreshResult(null)} className="ml-3 underline">닫기</button>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex gap-3 flex-wrap">
        <div className="relative">
          <input
            type="text"
            placeholder="티커 / 회사명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
        >
          <option value="">전체 섹터</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(search || sector) && (
          <button
            onClick={() => { setSearch(""); setSector(""); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="max-w-screen-2xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <p>등록된 종목이 없습니다.</p>
            <p className="text-xs">+ 종목 추가 버튼으로 시작하세요.</p>
          </div>
        ) : (
          <StockTable
            data={stocks}
            globalFilter={search}
            sectorFilter={sector}
            onDeleted={(ticker) => setStocks((prev) => prev.filter((s) => s.ticker !== ticker))}
          />
        )}
      </div>
      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchStocks}
        />
      )}
    </div>
  );
}
