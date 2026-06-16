"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStockModal({ onClose, onAdded }: Props) {
  const [ticker, setTicker] = useState("");
  const [nameKr, setNameKr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [sector, setSector] = useState("");
  const [exchange, setExchange] = useState("NASDAQ");
  const [status, setStatus] = useState<"idle" | "looking-up" | "saving" | "fetching" | "done" | "error">("idle");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleTickerBlur() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setLookupStatus("loading");
    try {
      const res = await fetch(`/api/stocks/lookup?ticker=${encodeURIComponent(t)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.name_en && !nameEn) setNameEn(data.name_en);
      if (data.sector && !sector) setSector(data.sector);
      if (data.exchange && data.exchange !== "NasdaqGS" && data.exchange !== "NMS") {
        // keep user's exchange selection unless we get something useful
      }
      setLookupStatus("found");
    } catch {
      setLookupStatus("notfound");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      // 1. DB에 종목 추가
      const addRes = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          name_kr: nameKr.trim() || null,
          name_en: nameEn.trim() || null,
          sector: sector.trim() || null,
          exchange,
        }),
      });

      if (!addRes.ok) {
        const data = await addRes.json();
        throw new Error(data.error ?? "종목 추가 실패");
      }

      // 2. Yahoo Finance에서 재무지표 자동 조회
      setStatus("fetching");
      const refreshRes = await fetch(`/api/stocks/${ticker.trim().toUpperCase()}/refresh`, {
        method: "POST",
      });

      if (!refreshRes.ok) {
        console.warn("Yahoo refresh failed for", ticker);
      }

      setStatus("done");
      setTimeout(() => {
        onAdded();
        onClose();
      }, 800);
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }

  const isLoading = status === "saving" || status === "fetching";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">종목 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker — required */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              티커 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value.toUpperCase());
                  setLookupStatus("idle");
                }}
                onBlur={handleTickerBlur}
                placeholder="AAPL"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {lookupStatus === "loading" && (
                <span className="absolute right-3 top-2 text-xs text-gray-400">조회 중...</span>
              )}
              {lookupStatus === "found" && (
                <span className="absolute right-3 top-2 text-xs text-green-600">✓ 자동 완성</span>
              )}
              {lookupStatus === "notfound" && (
                <span className="absolute right-3 top-2 text-xs text-orange-500">종목 없음</span>
              )}
            </div>
          </div>

          {/* Korean name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">한글 회사명</label>
            <input
              type="text"
              value={nameKr}
              onChange={(e) => setNameKr(e.target.value)}
              placeholder="애플"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* English name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              영문 회사명
              {lookupStatus === "found" && nameEn && (
                <span className="ml-1 text-green-600 font-normal">(자동 완성됨)</span>
              )}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Apple Inc."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sector + Exchange */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                섹터
                {lookupStatus === "found" && sector && (
                  <span className="ml-1 text-green-600 font-normal">(자동)</span>
                )}
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Technology"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">거래소</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>NASDAQ</option>
                <option>NYSE</option>
                <option>AMEX</option>
                <option>OTHER</option>
              </select>
            </div>
          </div>

          {/* Status messages */}
          {status === "saving" && (
            <p className="text-xs text-blue-600">DB에 저장 중...</p>
          )}
          {status === "fetching" && (
            <p className="text-xs text-blue-600">Yahoo Finance에서 재무지표 가져오는 중...</p>
          )}
          {status === "done" && (
            <p className="text-xs text-green-600">추가 완료!</p>
          )}
          {status === "error" && (
            <p className="text-xs text-red-600">{errorMsg}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !ticker.trim()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "처리 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
