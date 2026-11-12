To ensure your application matches the designs **pixel-for-pixel**, here is the complete **Design System & CSS Styling Specification** extracted directly from your screenshots.

You can feed this directly into Antigravity or replace your `tailwind.config.ts` and `app/globals.css` with these exact definitions.

---

### 1. Exact Color Palette & Design Tokens

```
                                [ PALETTE BREAKDOWN ]
  Dark Forest Green         Cooperative Accent         App Background            Card Surface
     `#063A2F`                  `#0D7A5F`                `#F8FAFC`                 `#FFFFFF`
  (Sidebar / Active)       (Buttons / Highlights)        (Canvas)               (Elevated Cards)
```

#### A. Core Brand & Navigation Colors
* **Sidebar Deep Forest Green:** `#063A2F` (Deep emerald/forest background)
* **Sidebar Active Nav Item:** `#0D4A3C` (Slightly lighter with rounded pill radius)
* **Primary Cooperative Green (Buttons/Badges):** `#0D7A5F` / `#0F5132`
* **Primary Hover Green:** `#0A634D`
* **App Canvas Background:** `#F8FAFC` / `#F3F4F6` (Cool, clean light gray)
* **Card Surface:** `#FFFFFF` with border `#E2E8F0` and shadow `shadow-sm`

#### B. KPI Metric Icon Bubble Colors
The circular icon badges on the metric cards:
* **Members / Savings Icon Bubble:** Green (`bg-[#E6F4EA]` / `text-[#0D7A5F]`)
* **Savings Account Bubble:** Blue (`bg-[#E8F0FE]` / `text-[#1A73E8]`)
* **Share Capital Bubble:** Purple (`bg-[#F3E8FD]` / `text-[#9334E8]`)
* **Loan Portfolio Bubble:** Amber/Orange (`bg-[#FEF3E6]` / `text-[#E8710A]`)

#### C. Transaction & Loan Status Pills (Exact Match)
| Status | Badge Background | Badge Text | Dot Color |
| :--- | :--- | :--- | :--- |
| **Completed / Active** | `#DCFCE7` (Mint Green) | `#15803D` | `#16A34A` |
| **Pending** | `#FEF3C7` (Warm Yellow) | `#B45309` | `#D97706` |
| **Under Review** | `#DBEAFE` (Soft Blue) | `#1D4ED8` | `#2563EB` |
| **Disbursed** | `#F3E8FF` (Soft Purple) | `#7E22CE` | `#9333EA` |
| **Rejected / Dormant**| `#FEE2E2` (Soft Red) | `#B91C1C` | `#DC2626` |
| **On Hold** | `#FFEDD5` (Soft Orange) | `#C2410C` | `#EA580C` |

---

### 2. `tailwind.config.ts` (Drop-in Configuration)

Add these custom colors and tokens to your `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sacco: {
          sidebar: '#063A2F',
          sidebarHover: '#094538',
          sidebarActive: '#0D4A3C',
          primary: '#0D7A5F',
          primaryHover: '#0A634D',
          dark: '#042820',
          accent: '#10B981',
        },
        kpi: {
          greenBg: '#E6F4EA',
          greenText: '#0D7A5F',
          blueBg: '#E8F0FE',
          blueText: '#1A73E8',
          purpleBg: '#F3E8FD',
          purpleText: '#9334E8',
          amberBg: '#FEF3E6',
          amberText: '#E8710A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

### 3. Reusable UI Components (Strict Visual Clones)

#### A. Metric KPI Card Component (`components/shared/KpiCard.tsx`)
Replicates the top-row metric cards from the screenshots:

```tsx
// components/shared/KpiCard.tsx
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'purple' | 'amber';
}

const colorVariants = {
  green: { bg: 'bg-kpi-greenBg', text: 'text-kpi-greenText' },
  blue: { bg: 'bg-kpi-blueBg', text: 'text-kpi-blueText' },
  purple: { bg: 'bg-kpi-purpleBg', text: 'text-kpi-purpleText' },
  amber: { bg: 'bg-kpi-amberBg', text: 'text-kpi-amberText' },
};

export function KpiCard({ title, value, trend, icon, variant }: KpiCardProps) {
  const c = colorVariants[variant];
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{value}</h3>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>{trend}</span>
      </div>
    </div>
  );
}
```

#### B. Exact Status Pill Component (`components/shared/StatusPill.tsx`)
Replicates the status badges seen in the tables:

```tsx
// components/shared/StatusPill.tsx
import React from 'react';

type StatusType = 'completed' | 'pending' | 'under_review' | 'approved' | 'disbursed' | 'rejected' | 'active' | 'on_hold' | 'dormant';

interface StatusPillProps {
  status: StatusType;
  label?: string;
}

const statusStyles: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', defaultLabel: 'Completed' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', defaultLabel: 'Active' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', defaultLabel: 'Approved' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', defaultLabel: 'Pending' },
  under_review: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', defaultLabel: 'Under Review' },
  disbursed: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', defaultLabel: 'Disbursed' },
  on_hold: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', defaultLabel: 'On Hold' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', defaultLabel: 'Rejected' },
  dormant: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', defaultLabel: 'Dormant' },
};

export function StatusPill({ status, label }: StatusPillProps) {
  const s = statusStyles[status] || statusStyles.completed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label || s.defaultLabel}
    </span>
  );
}
```

#### C. Top Header Bar (`components/layouts/Header.tsx`)
Replicates the top bar with search, notification badge, and tenant badge:

```tsx
// components/layouts/Header.tsx
import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  userFullName: string;
  userRole: string;
  saccoName: string;
  unreadCount?: number;
}

export function Header({ userFullName, userRole, saccoName, unreadCount = 3 }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
      {/* Search Input */}
      <div className="relative w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search members, loans, transactions..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sacco-primary/20 focus:border-sacco-primary"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
            {userFullName.charAt(0)}
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-slate-800 leading-tight">{userFullName}</p>
            <p className="text-slate-500">{userRole}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>

        {/* SACCO Pill */}
        <div className="bg-sacco-primary text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {saccoName}
        </div>
      </div>
    </header>
  );
}
```

---

### 4. Instruction to Add to Your Antigravity Instructions File

Add this rule to your `PROJECT_SPEC.md` or Antigravity prompt instructions:

> **UI & Styling Instruction:**  
> *"All pages must strictly follow the visual style in `components/shared/`: deep forest green sidebar (`#063A2F`), clean white cards (`#FFFFFF` with `#E2E8F0` border), standard 12px/16px rounded corners, circular KPI icon bubbles, and specific status badge color combinations (Mint for Completed, Amber for Pending, Soft Blue for Under Review, Soft Red for Rejected). Do not use generic purple or blue brand colors; use cooperative dark green (`#0D7A5F`)."*