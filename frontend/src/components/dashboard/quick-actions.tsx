'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, Users, BarChart3 } from 'lucide-react'

const actions = [
  {
    title: 'Build New PC',
    description: 'Start building a new PC with components',
    href: '/pcs/new',
    icon: Plus,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Add Inventory',
    description: 'Add new parts to inventory',
    href: '/inventory/new',
    icon: Package,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Add Buyer',
    description: 'Register a new customer',
    href: '/buyers/new',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'View Reports',
    description: 'Check sales and profit reports',
    href: '/reports',
    icon: BarChart3,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className={`rounded-md p-2 mr-3 text-white ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}