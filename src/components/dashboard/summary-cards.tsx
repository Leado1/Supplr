import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InventorySummary } from "@/types/inventory";

interface SummaryCardsProps {
  summary: InventorySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const cards = [
    {
      title: "Total Items",
      value: summary.totalItems.toString(),
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
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Total Value",
      value: formatCurrency(summary.totalValue),
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
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      title: "Expiring Soon",
      value: summary.expiringSoon.toString(),
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
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
      badge: summary.expiringSoon > 0 ? "warning" : undefined,
    },
    {
      title: "Expired Items",
      value: summary.expired.toString(),
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
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      badge: summary.expired > 0 ? "destructive" : undefined,
    },
    {
      title: "Low Stock",
      value: summary.lowStock.toString(),
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
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      badge: summary.lowStock > 0 ? "warning" : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <div className={card.color}>{card.icon}</div>
            </div>
            {card.badge && (
              <Badge
                variant={card.badge as any}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                !
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.title === "Total Value" && (
              <p className="text-xs text-muted-foreground">
                Current inventory valuation
              </p>
            )}
            {card.title === "Expiring Soon" && summary.expiringSoon > 0 && (
              <div className="flex items-center gap-1">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Action needed
                </p>
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" title="AI waste prevention active" />
              </div>
            )}
            {card.title === "Expired Items" && summary.expired > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Remove from inventory
              </p>
            )}
            {card.title === "Low Stock" && summary.lowStock > 0 && (
              <div className="flex items-center gap-1">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Reorder recommended
                </p>
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" title="AI-powered prediction" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
