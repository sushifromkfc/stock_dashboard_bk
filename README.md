# Stock Dashboard

아버지 관심 종목 핵심 재무지표 비교 대시보드. Excel 스프레드시트를 대체하기 위해 제작.

배포: **https://stock-dashboard-bk.vercel.app/**

---

## 기능

- 126개 미국 주식 관심 종목 관리 (추가/삭제)
- 핵심 재무지표 표시: EBIT, Working Capital, Net PP&E, Total Debt, Market Cap
- 티커/회사명 검색, 섹터 필터
- 컬럼별 정렬
- 전체 갱신 (Yahoo Finance API)
- CSV 내보내기

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 |
| 테이블 | TanStack Table v8 |
| DB | Supabase (PostgreSQL) |
| 재무 데이터 | yahoo-finance2 |
| 배포 | Vercel |

---

## 재무 데이터 API: FMP → Yahoo Finance 전환

### 변경 이력

**이전**: Financial Modeling Prep (FMP) 무료 플랜  
**현재**: [yahoo-finance2](https://www.npmjs.com/package/yahoo-finance2) (비공식 Yahoo Finance npm 패키지)

### 전환 이유

FMP 무료 플랜은 **하루 250 requests** 제한이 있음.

- 126개 종목 전체 갱신 = 종목당 3 API 호출 (income-statement, balance-sheet, profile) × 126 = **378 calls**
- 250 limit을 초과하므로 **1회 전체 갱신도 불가능**
- 개발/테스트 중에도 금방 한도를 소진해 **병목이 계속 발생**

Yahoo Finance (yahoo-finance2) 로 전환하면:

- **일일 제한 없음** — 부드럽게 전체 갱신 가능
- 1종목당 **1 API 호출**로 모든 지표 수집 (`quoteSummary` 한 번)
- 무료, API 키 불필요

### 단점 (감수)

yahoo-finance2는 Yahoo Finance 공식 API가 아닌 내부 API를 사용하는 비공식 패키지.  
Yahoo 정책 변경 시 응답 형식이 바뀔 수 있으나, 개인 대시보드 용도로는 충분히 안정적.

### 변경된 파일

| 파일 | 변경 내용 |
|---|---|
| `lib/yahoo.ts` | 신규 — yahoo-finance2 기반 재무 데이터 fetch 함수 |
| `app/api/stocks/[ticker]/refresh/route.ts` | `fetchFmpMetrics` → `fetchYahooMetrics` |
| `app/api/stocks/refresh-all/route.ts` | `fetchFmpMetrics` → `fetchYahooMetrics` |
| `app/page.tsx` | 버튼 레이블 "전체 갱신 (FMP)" → "전체 갱신 (Yahoo Finance)" |
| `package.json` | `yahoo-finance2` 추가 |

---

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 Supabase URL/Key 입력

# 개발 서버 실행
npm run dev
```

### 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> **FMP API 키는 더 이상 필요 없음** (Yahoo Finance로 전환됨)

---

## DB 스키마

**stocks**
```
id (uuid), ticker (text, unique), name_kr, name_en, sector, exchange, currency
```

**stock_key_metrics**
```
id, stock_id (fk → stocks.id), period, ebit_ttm, working_capital, net_ppe,
total_debt, market_cap, data_source, updated_at
```

---

## 종목 추가/초기 데이터

```bash
# 종목 일괄 import (F.I.xlsx 기반 126개)
npx ts-node scripts/import-xlsx.ts
```
