'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Pc } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Computer, DollarSign, TrendingUp, Clock } from 'lucide-react'

export function DashboardStats() {
  const { data: pcs, isLoading } = useQuery({
    queryKey: ['pcs'],
    queryFn: async () => {
      const response = await api.get<Pc[]>('/pcs')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const stats = pcs ? calculateStats(pcs) : null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total PCs
            </p>
            <p className="text-2xl font-bold">
              {stats?.totalPcs || 0}
            </p>
          </div>
          <Computer className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Currently Listed
            </p>
            <p className="text-2xl font-bold">
              {stats?.listedPcs || 0}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Monthly Sales
            </p>
            <p className="text-2xl font-bold">
              {stats?.monthlySales ? formatCurrency(stats.monthlySales) : 'kr0'}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Avg. Days to Sale
            </p>
            <p className="text-2xl font-bold">
              {stats?.avgDaysToSale || 0}
            </p>
          </div>
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}

function calculateStats(pcs: Pc[]) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  
  const totalPcs = pcs.length
  const listedPcs = pcs.filter(pc => pc.status === 'listed').length
  
  const soldThisMonth = pcs.filter(pc => 
    pc.sale_date && pc.sale_date.startsWith(currentMonth)
  )
  
  const monthlySales = soldThisMonth.reduce((sum, pc) => 
    sum + (pc.actual_sale_price || 0), 0
  )
  
  const soldPcs = pcs.filter(pc => pc.status === 'sold' && pc.days_held)
  const avgDaysToSale = soldPcs.length > 0 
    ? Math.round(soldPcs.reduce((sum, pc) => sum + (pc.days_held || 0), 0) / soldPcs.length)
    : 0

  return {
    totalPcs,
    listedPcs,
    monthlySales,
    avgDaysToSale,
  }
}