'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Pc } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Computer, TrendingUp, Clock, DollarSign } from 'lucide-react'

export default function PcsPage() {
  const { data: pcs, isLoading, error } = useQuery({
    queryKey: ['pcs'],
    queryFn: async () => {
      const response = await api.get<Pc[]>('/pcs')
      return response.data
    },
  })

  const statusColors = {
    building: 'bg-yellow-100 text-yellow-800',
    listed: 'bg-blue-100 text-blue-800',
    sold: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    building: 'Building',
    listed: 'Listed',
    sold: 'Sold',
    archived: 'Archived',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PC Inventory</h1>
          <p className="text-muted-foreground">
            Manage your PC builds and inventory
          </p>
        </div>
        <Link href="/pcs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Build New PC
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              Error loading PCs: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pcs && pcs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pcs.map((pc) => (
            <Card key={pc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pc.pc_name}</CardTitle>
                    <CardDescription>
                      {pc.build_date ? `Built: ${formatDate(pc.build_date)}` : 'Date not set'}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[pc.status]}`}>
                    {statusLabels[pc.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>
                        {pc.intended_price ? formatCurrency(pc.intended_price) : 'No price set'}
                      </span>
                    </div>
                    {pc.total_cost && (
                      <div className="flex items-center">
                        <Computer className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Cost: {formatCurrency(pc.total_cost)}</span>
                      </div>
                    )}
                    {pc.actual_sale_price && (
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>Sold: {formatCurrency(pc.actual_sale_price)}</span>
                      </div>
                    )}
                    {pc.days_held && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{pc.days_held} days held</span>
                      </div>
                    )}
                  </div>
                  
                  {pc.profit !== null && pc.profit !== undefined && (
                    <div className={`text-sm font-medium ${pc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Profit: {pc.profit >= 0 ? '+' : ''}{formatCurrency(pc.profit)}
                      {pc.profit_percentage && ` (${pc.profit_percentage.toFixed(1)}%)`}
                    </div>
                  )}
                  
                  {pc.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pc.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Computer className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No PCs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by building your first PC
            </p>
            <Link href="/pcs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Build New PC
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}