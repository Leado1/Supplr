import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventorySummary } from "@/types/inventory";

interface SummaryCardsProps {
  summary: InventorySummary | null | undefined;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  // Provide default values if summary is undefined/null with explicit safety
  const safeSummary = {
    totalItems: summary?.totalItems ?? 0,
    totalValue: summary?.totalValue ?? 0,
    expiringSoon: summary?.expiringSoon ?? 0,
    expired: summary?.expired ?? 0,
    lowStock: summary?.lowStock ?? 0,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const cards = [
    {
      title: "Total Items",
      value: String(safeSummary.totalItems || 0),
      iconWrapperClass:
        "bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: "Total Value",
      value: formatCurrency(safeSummary.totalValue || 0),
      iconWrapperClass:
        "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      title: "Expiring Soon",
      value: String(safeSummary.expiringSoon || 0),
      iconWrapperClass:
        "bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Expired Items",
      value: String(safeSummary.expired || 0),
      iconWrapperClass:
        "bg-red-100/80 text-red-700 dark:bg-red-500/10 dark:text-red-300",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
    },
    {
      title: "Low Stock",
      value: String(safeSummary.lowStock || 0),
      iconWrapperClass:
        "bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.iconWrapperClass}`}>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.title === "Total Value" && (
              <p className="text-xs text-muted-foreground">
                Current inventory valuation
              </p>
            )}
            {card.title === "Expiring Soon" && safeSummary.expiringSoon > 0 && (
              <p className="text-xs text-muted-foreground">
                Action needed
              </p>
            )}
            {card.title === "Expired Items" && safeSummary.expired > 0 && (
              <p className="text-xs text-muted-foreground">
                Remove from inventory
              </p>
            )}
            {card.title === "Low Stock" && safeSummary.lowStock > 0 && (
              <p className="text-xs text-muted-foreground">
                Reorder recommended
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
