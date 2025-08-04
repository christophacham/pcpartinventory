'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { InventoryPart, CreateInventoryPartRequest } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Package, 
  Search, 
  AlertTriangle,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react'

const componentTypes = [
  'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'CPU Cooler', 'Additional'
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null)
  
  const queryClient = useQueryClient()

  const { data: parts, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get<InventoryPart[]>('/inventory')
      return response.data
    },
  })

  const createPartMutation = useMutation({
    mutationFn: async (data: CreateInventoryPartRequest) => {
      const response = await api.post('/inventory', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setShowAddForm(false)
    },
  })

  const filteredParts = parts?.filter(part => {
    const matchesSearch = part.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.component_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || part.component_type.toLowerCase() === selectedType.toLowerCase()
    return matchesSearch && matchesType
  }) || []

  const lowStockParts = parts?.filter(part => part.quantity_available <= 2) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">
            Manage your PC component inventory and stock levels
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-2">
              {lowStockParts.length} item(s) are running low on stock:
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockParts.map(part => (
                <span 
                  key={part.id}
                  className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm"
                >
                  {part.component_name} ({part.quantity_available} left)
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {componentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parts Grid */}
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
      ) : filteredParts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.map((part) => (
            <Card key={part.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{part.component_name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      {part.component_type}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={`ml-2 font-medium ${
                        part.quantity_available <= 2 ? 'text-red-600' : 
                        part.quantity_available <= 5 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {part.quantity_available}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Buy Price:</span>
                      <span className="ml-2 font-medium">
                        {part.buy_in_price ? formatCurrency(part.buy_in_price) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sell Price:</span>
                      <span className="ml-2 font-medium">
                        {part.typical_sell_price ? formatCurrency(part.typical_sell_price) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="ml-2 font-medium">
                        {part.buy_in_price && part.typical_sell_price ? 
                          `${(((part.typical_sell_price - part.buy_in_price) / part.buy_in_price) * 100).toFixed(1)}%` 
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {part.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {part.notes}
                    </p>
                  )}
                  
                  {part.purchase_link && (
                    <div className="pt-2 border-t">
                      <Link 
                        href={part.purchase_link} 
                        target="_blank"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Purchase Link
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'No parts match your search criteria' 
                : 'Get started by adding your first part to inventory'
              }
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Part Modal/Form */}
      {showAddForm && (
        <AddPartForm 
          onClose={() => setShowAddForm(false)}
          onSubmit={(data) => createPartMutation.mutate(data)}
          isLoading={createPartMutation.isPending}
        />
      )}
    </div>
  )
}

function AddPartForm({ 
  onClose, 
  onSubmit, 
  isLoading 
}: { 
  onClose: () => void
  onSubmit: (data: CreateInventoryPartRequest) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateInventoryPartRequest>({
    component_type: 'CPU',
    component_name: '',
    buy_in_price: undefined,
    typical_sell_price: undefined,
    quantity_available: 1,
    notes: undefined,
    purchase_link: undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Part</CardTitle>
          <CardDescription>
            Add a new component to your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Component Type *
              </label>
              <select
                value={formData.component_type}
                onChange={(e) => setFormData({...formData, component_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {componentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Component Name *
              </label>
              <input
                type="text"
                value={formData.component_name}
                onChange={(e) => setFormData({...formData, component_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Intel i7-13700K"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buy-in Price (kr)
                </label>
                <input
                  type="number"
                  value={formData.buy_in_price || ''}
                  onChange={(e) => setFormData({...formData, buy_in_price: e.target.value ? parseFloat(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Sell Price (kr)
                </label>
                <input
                  type="number"
                  value={formData.typical_sell_price || ''}
                  onChange={(e) => setFormData({...formData, typical_sell_price: e.target.value ? parseFloat(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity Available
              </label>
              <input
                type="number"
                value={formData.quantity_available || ''}
                onChange={(e) => setFormData({...formData, quantity_available: e.target.value ? parseInt(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Purchase Link
              </label>
              <input
                type="url"
                value={formData.purchase_link || ''}
                onChange={(e) => setFormData({...formData, purchase_link: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes about this part..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.component_name}
              >
                {isLoading ? 'Adding...' : 'Add Part'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}