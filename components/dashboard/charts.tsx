"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dailySeries,
  expenseByCategory,
  paymentMethodBreakdown,
  topProducts,
} from "@/lib/business-logic/analytics";
import type {
  Expense,
  ExpenseWithCategory,
  TransactionItem,
  TransactionWithItems,
} from "@/lib/types";

type TxWithItems = TransactionWithItems & { transaction_items?: TransactionItem[] };

const COLORS = [
  "hsl(var(--primary))",
  "hsl(172 66% 65%)",
  "hsl(38 92% 50%)",
  "hsl(220 70% 55%)",
  "hsl(280 60% 55%)",
  "hsl(0 72% 55%)",
];

export function DashboardCharts({
  transactions,
  expenses,
  loading,
}: {
  transactions: TxWithItems[];
  expenses: ExpenseWithCategory[] | Expense[];
  loading?: boolean;
}) {
  const series = dailySeries(transactions, expenses as Expense[]);
  const payments = paymentMethodBreakdown(transactions);
  const top = topProducts(transactions, 5);
  const byCat = expenseByCategory(expenses as ExpenseWithCategory[]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Gross vs Expenses vs Net</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="gross" stroke={COLORS[0]} dot={false} name="Gross" />
              <Line type="monotone" dataKey="expenses" stroke={COLORS[5]} dot={false} name="Expenses" />
              <Line type="monotone" dataKey="net" stroke={COLORS[3]} dot={false} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">COGS vs Gross vs Gross Profit</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="gross" stroke={COLORS[0]} dot={false} name="Gross" />
              <Line type="monotone" dataKey="cogs" stroke={COLORS[2]} dot={false} name="COGS" />
              <Line
                type="monotone"
                dataKey="gross_profit"
                stroke={COLORS[3]}
                dot={false}
                name="Gross profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top products by revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer>
            <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" fontSize={11} />
              <YAxis dataKey="name" type="category" fontSize={11} width={100} />
              <Tooltip />
              <Bar dataKey="revenue" fill={COLORS[0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sales by payment method</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={payments}
                dataKey="total"
                nameKey="method"
                innerRadius={40}
                outerRadius={80}
                label
              >
                {payments.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Expenses by category</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer>
            <BarChart data={byCat}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="category" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="total" fill={COLORS[5]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
