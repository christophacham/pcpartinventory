'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pc } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export function RecentSales() {
  const { data: pcs, isLoading } = useQuery({
    queryKey: ['pcs'],
    queryFn: async () => {
      const response = await api.get<Pc[]>('/pcs')
      return response.data
    },
  })

  const recentSales = pcs
    ?.filter(pc => pc.status === 'sold' && pc.sale_date)
    .sort((a, b) => new Date(b.sale_date!).getTime() - new Date(a.sale_date!).getTime())
    .slice(0, 5) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          Latest PC sales transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : recentSales.length > 0 ? (
            recentSales.map((pc) => (
              <div key={pc.id} className="flex items-center">
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {pc.pc_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sold on {formatDate(pc.sale_date!)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {pc.actual_sale_price ? formatCurrency(pc.actual_sale_price) : 'N/A'}
                  </div>
                  {pc.profit && (
                    <div className={`text-sm ${pc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pc.profit >= 0 ? '+' : ''}{formatCurrency(pc.profit)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent sales</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}