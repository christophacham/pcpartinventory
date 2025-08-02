'use client'

import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your PC inventory and sales
        </p>
      </div>

      <DashboardStats />
      
      <div className="grid gap-8 md:grid-cols-2">
        <RecentSales />
        <QuickActions />
      </div>
    </div>
  )
}