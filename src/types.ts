export interface SEORequest {
  domain: string
  trade: string
  city: string
  state: string
}

export interface SEOCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface SEOAction {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  action: string
}

export interface SEOResult {
  domain: string
  trade: string
  city: string
  state: string
  score: number
  timestamp: string
  sections: Record<string, SEOCheck[]>
  actions: SEOAction[]
}

export const TRADES = [
  'Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Landscaping',
  'Painting', 'Solar', 'Tree Service', 'Concrete', 'Fencing',
  'General Contractor', 'Remodeling', 'Flooring', 'Windows',
  'Gutters', 'Pest Control', 'Cleaning', 'Moving',
]

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]
