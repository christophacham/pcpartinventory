'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { CreatePcRequest, ComponentType } from '@/types'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Component {
  id: string
  component_type: ComponentType
  component_name: string
  cost: number
  notes?: string
}

const componentTypes: { value: ComponentType; label: string }[] = [
  { value: 'Cpu', label: 'CPU' },
  { value: 'Gpu', label: 'GPU' },
  { value: 'Motherboard', label: 'Motherboard' },
  { value: 'Ram', label: 'RAM' },
  { value: 'Storage1', label: 'Primary Storage' },
  { value: 'Storage2', label: 'Secondary Storage' },
  { value: 'Psu', label: 'Power Supply' },
  { value: 'Case', label: 'Case' },
  { value: 'CpuCooler', label: 'CPU Cooler' },
  { value: 'Additional', label: 'Additional' },
]

export default function BuildPcPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [pcName, setPcName] = useState('')
  const [buildDate, setBuildDate] = useState('')
  const [intendedPrice, setIntendedPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [components, setComponents] = useState<Component[]>([
    {
      id: '1',
      component_type: 'Cpu',
      component_name: '',
      cost: 0,
      notes: ''
    }
  ])

  const createPcMutation = useMutation({
    mutationFn: async (data: CreatePcRequest) => {
      const response = await api.post('/pcs', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pcs'] })
      router.push('/pcs')
    },
    onError: (error) => {
      console.error('Error creating PC:', error)
    }
  })

  const addComponent = () => {
    const newComponent: Component = {
      id: Date.now().toString(),
      component_type: 'Cpu',
      component_name: '',
      cost: 0,
      notes: ''
    }
    setComponents([...components, newComponent])
  }

  const removeComponent = (id: string) => {
    if (components.length > 1) {
      setComponents(components.filter(c => c.id !== id))
    }
  }

  const updateComponent = (id: string, field: keyof Component, value: any) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: CreatePcRequest = {
      pc_name: pcName,
      build_date: buildDate || undefined,
      intended_price: intendedPrice ? parseFloat(intendedPrice) : undefined,
      notes: notes || undefined,
      components: components.map(({ id, ...component }) => ({
        component_type: component.component_type,
        component_name: component.component_name,
        cost: component.cost,
        notes: component.notes || undefined
      }))
    }

    createPcMutation.mutate(data)
  }

  const totalCost = components.reduce((sum, component) => sum + component.cost, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build New PC</h1>
          <p className="text-muted-foreground">
            Create a new PC build with components and pricing
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* PC Details */}
          <Card>
            <CardHeader>
              <CardTitle>PC Details</CardTitle>
              <CardDescription>
                Basic information about the PC build
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  PC Name *
                </label>
                <input
                  type="text"
                  value={pcName}
                  onChange={(e) => setPcName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Gaming PC Build #1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Build Date
                </label>
                <input
                  type="date"
                  value={buildDate}
                  onChange={(e) => setBuildDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Intended Price (kr)
                </label>
                <input
                  type="number"
                  value={intendedPrice}
                  onChange={(e) => setIntendedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15000"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes about this build..."
                />
              </div>

              <div className="pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total Cost: kr{totalCost.toLocaleString()}
                </div>
                {intendedPrice && (
                  <div className="text-sm text-muted-foreground">
                    Expected Profit: kr{(parseFloat(intendedPrice) - totalCost).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Components</CardTitle>
                  <CardDescription>
                    Add components and their costs
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComponent}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {components.map((component, index) => (
                  <div key={component.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Component {index + 1}</span>
                      {components.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeComponent(component.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Type
                        </label>
                        <select
                          value={component.component_type}
                          onChange={(e) => updateComponent(component.id, 'component_type', e.target.value as ComponentType)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {componentTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Component Name
                        </label>
                        <input
                          type="text"
                          value={component.component_name}
                          onChange={(e) => updateComponent(component.id, 'component_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Intel i7-13700K"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Cost (kr)
                        </label>
                        <input
                          type="number"
                          value={component.cost || ''}
                          onChange={(e) => updateComponent(component.id, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="4500"
                          min="0"
                          step="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={component.notes || ''}
                          onChange={(e) => updateComponent(component.id, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPcMutation.isPending || !pcName}
          >
            {createPcMutation.isPending ? 'Creating...' : 'Create PC Build'}
          </Button>
        </div>
      </form>
    </div>
  )
}