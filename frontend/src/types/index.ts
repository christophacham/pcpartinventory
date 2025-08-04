export interface Pc {
  id: string
  pc_name: string
  build_date?: string
  list_date?: string
  sale_date?: string
  days_listed?: number
  days_held?: number
  buyer_id?: string
  platform?: string
  platform_reference?: string
  intended_price?: number
  actual_sale_price?: number
  total_cost?: number
  profit?: number
  profit_percentage?: number
  notes?: string
  status: 'building' | 'listed' | 'sold' | 'archived'
  created_at: string
  updated_at: string
}

export interface Component {
  id: string
  pc_id: string
  component_type: ComponentType
  component_name: string
  cost: number
  notes?: string
}

export type ComponentType = 
  | 'Cpu'
  | 'Gpu' 
  | 'Motherboard'
  | 'Ram'
  | 'Storage1'
  | 'Storage2'
  | 'Psu'
  | 'Case'
  | 'CpuCooler'
  | 'Additional'

export interface PcWithComponents extends Pc {
  components: Component[]
}

export interface InventoryPart {
  id: string
  component_type: string
  component_name: string
  buy_in_price?: number
  typical_sell_price?: number
  quantity_available: number
  notes?: string
  purchase_link?: string
  created_at: string
  updated_at: string
}

export interface CreateInventoryPartRequest {
  component_type: string
  component_name: string
  buy_in_price?: number
  typical_sell_price?: number
  quantity_available?: number
  notes?: string
  purchase_link?: string
}

export interface UpdateInventoryPartRequest {
  component_name?: string
  buy_in_price?: number
  typical_sell_price?: number
  quantity_available?: number
  notes?: string
  purchase_link?: string
}

export interface Buyer {
  id: string
  name: string
  contact?: string
  email?: string
  phone?: string
  created_at: string
}

export interface CreateBuyerRequest {
  name: string
  contact?: string
  email?: string
  phone?: string
}

export interface CreatePcRequest {
  pc_name: string
  build_date?: string
  intended_price?: number
  notes?: string
  components: CreateComponentRequest[]
}

export interface CreateComponentRequest {
  component_type: ComponentType
  component_name: string
  cost: number
  notes?: string
}

export interface MonthlySummary {
  month_year: string
  total_sales?: number
  total_profit?: number
  pcs_sold: number
  average_days_held?: number
  average_profit_margin?: number
}

export interface ProfitAnalysis {
  component_type: string
  avg_cost?: number
  total_usage: number
  avg_profit_contribution?: number
}