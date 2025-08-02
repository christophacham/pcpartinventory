'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Computer, 
  Package, 
  Users, 
  BarChart3,
  Plus
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'PC Inventory', href: '/pcs', icon: Computer },
  { name: 'Parts Inventory', href: '/inventory', icon: Package },
  { name: 'Buyers', href: '/buyers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Build PC', href: '/pcs/new', icon: Plus },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center">
          <div className="mr-8">
            <Link href="/" className="flex items-center space-x-2">
              <Computer className="h-6 w-6" />
              <span className="font-bold">PC Tracker</span>
            </Link>
          </div>
          
          <div className="flex space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}