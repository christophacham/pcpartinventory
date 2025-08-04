'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Buyer, CreateBuyerRequest } from '@/types'
import { formatDate } from '@/lib/utils'
import { 
  Plus, 
  Users, 
  Search, 
  Mail,
  Phone,
  MessageCircle,
  Edit,
  Trash2,
  ShoppingCart
} from 'lucide-react'

export default function BuyersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: buyers, isLoading, error } = useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const response = await api.get<Buyer[]>('/buyers')
      return response.data
    },
  })

  const createBuyerMutation = useMutation({
    mutationFn: async (data: CreateBuyerRequest) => {
      const response = await api.post('/buyers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] })
      setShowAddForm(false)
    },
  })

  const filteredBuyers = buyers?.filter(buyer => {
    const matchesSearch = buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
          <p className="text-muted-foreground">
            Manage your customer database and purchase history
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Buyer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              Error loading buyers: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Buyers Grid */}
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
      ) : filteredBuyers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBuyers.map((buyer) => (
            <Card key={buyer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{buyer.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Customer since {formatDate(buyer.created_at)}
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
                  {buyer.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`mailto:${buyer.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {buyer.email}
                      </a>
                    </div>
                  )}
                  
                  {buyer.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`tel:${buyer.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {buyer.phone}
                      </a>
                    </div>
                  )}
                  
                  {buyer.contact && buyer.contact !== buyer.email && (
                    <div className="flex items-center text-sm">
                      <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{buyer.contact}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        // Navigate to purchase history
                        console.log(`View purchases for ${buyer.name}`)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Purchases
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No buyers found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm 
                ? 'No buyers match your search criteria' 
                : 'Get started by adding your first buyer'
              }
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Buyer Modal/Form */}
      {showAddForm && (
        <AddBuyerForm 
          onClose={() => setShowAddForm(false)}
          onSubmit={(data) => createBuyerMutation.mutate(data)}
          isLoading={createBuyerMutation.isPending}
        />
      )}
    </div>
  )
}

function AddBuyerForm({ 
  onClose, 
  onSubmit, 
  isLoading 
}: { 
  onClose: () => void
  onSubmit: (data: CreateBuyerRequest) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateBuyerRequest>({
    name: '',
    contact: undefined,
    email: undefined,
    phone: undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Buyer</CardTitle>
          <CardDescription>
            Add a new customer to your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., John Anderson"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john.anderson@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+47 123 45 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Info
              </label>
              <input
                type="text"
                value={formData.contact || ''}
                onChange={(e) => setFormData({...formData, contact: e.target.value || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Username, social media, or other contact method"
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
                disabled={isLoading || !formData.name}
              >
                {isLoading ? 'Adding...' : 'Add Buyer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}