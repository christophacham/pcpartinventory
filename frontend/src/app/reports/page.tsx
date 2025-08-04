'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { MonthlySummary, ProfitAnalysis } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { 
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Activity
} from 'lucide-react'

export default function ReportsPage() {
  const { data: monthlySummary, isLoading: monthlyLoading, error: monthlyError } = useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: async () => {
      const response = await api.get<MonthlySummary[]>('/reports/monthly')
      return response.data
    },
  })

  const { data: profitAnalysis, isLoading: profitLoading, error: profitError } = useQuery({
    queryKey: ['reports', 'profit-analysis'],
    queryFn: async () => {
      const response = await api.get<ProfitAnalysis[]>('/reports/profit-analysis')
      return response.data
    },
  })

  const currentMonth = monthlySummary?.[0]
  const totalSales = monthlySummary?.reduce((sum, month) => sum + (month.total_sales || 0), 0) || 0
  const totalProfit = monthlySummary?.reduce((sum, month) => sum + (month.total_profit || 0), 0) || 0
  const totalPcsSold = monthlySummary?.reduce((sum, month) => sum + month.pcs_sold, 0) || 0
  
  const averageProfit = totalPcsSold > 0 ? totalProfit / totalPcsSold : 0
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track your PC sales performance and profitability
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(profitMargin)} margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PCs Sold</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPcsSold}</div>
            <p className="text-xs text-muted-foreground">
              Total units sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit/PC</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Per unit sold
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Monthly Summary
            </CardTitle>
            <CardDescription>
              Sales performance by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : monthlyError ? (
              <p className="text-red-600 text-sm">
                Error loading monthly data: {monthlyError instanceof Error ? monthlyError.message : 'Unknown error'}
              </p>
            ) : monthlySummary && monthlySummary.length > 0 ? (
              <div className="space-y-4">
                {monthlySummary.slice(0, 6).map((month) => (
                  <div key={month.month_year} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{month.month_year}</h4>
                        <p className="text-sm text-muted-foreground">
                          {month.pcs_sold} PC{month.pcs_sold !== 1 ? 's' : ''} sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {month.total_sales ? formatCurrency(month.total_sales) : 'N/A'}
                        </p>
                        <p className="text-sm text-green-600">
                          {month.total_profit ? `+${formatCurrency(month.total_profit)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {month.average_days_held && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg hold time: {month.average_days_held} days
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales data yet</p>
                <p className="text-sm text-muted-foreground">
                  Mark some PCs as sold to see monthly reports
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Component Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Component Analysis
            </CardTitle>
            <CardDescription>
              Average costs by component type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profitLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : profitError ? (
              <p className="text-red-600 text-sm">
                Error loading profit analysis: {profitError instanceof Error ? profitError.message : 'Unknown error'}
              </p>
            ) : profitAnalysis && profitAnalysis.length > 0 ? (
              <div className="space-y-4">
                {profitAnalysis
                  .sort((a, b) => (b.avg_cost || 0) - (a.avg_cost || 0))
                  .map((component) => (
                    <div key={component.component_type} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium capitalize">
                            {component.component_type}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Used {component.total_usage} time{component.total_usage !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {component.avg_cost ? formatCurrency(component.avg_cost) : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Avg cost
                          </p>
                        </div>
                      </div>
                      
                      {/* Visual bar for relative cost */}
                      {component.avg_cost && profitAnalysis.length > 1 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{
                                width: `${((component.avg_cost || 0) / Math.max(...profitAnalysis.map(c => c.avg_cost || 0))) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No component data yet</p>
                <p className="text-sm text-muted-foreground">
                  Build some PCs to see component analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      {currentMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Current Month Insights
            </CardTitle>
            <CardDescription>
              Performance metrics for {currentMonth.month_year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {currentMonth.pcs_sold}
                </p>
                <p className="text-sm text-muted-foreground">PCs Sold</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {currentMonth.average_days_held ? `${currentMonth.average_days_held}` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Days Held</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {currentMonth.average_profit_margin ? formatPercentage(currentMonth.average_profit_margin) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}