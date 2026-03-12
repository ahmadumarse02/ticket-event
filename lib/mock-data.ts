export type MockPriceTier = {
  name: string
  minAge?: number
  maxAge?: number
  price: number
}

export type MockEvent = {
  _id: string
  name: string
  description?: string
  type: "physical" | "online"
  status: "draft" | "published" | "cancelled" | "completed"
  venue?: string
  address?: string
  city?: string
  country?: string
  onlineUrl?: string
  onlinePlatform?: string
  startDate: number
  endDate: number
  timezone?: string
  recurrence: {
    type: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "custom"
    interval?: number
    endDate?: number
  }
  capacity?: number
  isFree: boolean
  priceTiers: MockPriceTier[]
  imageUrl?: string
  ticketTemplateId?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export type MockCustomer = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: number
  age?: number
  address?: string
  city?: string
  country?: string
  postalCode?: string
  notes?: string
  familyId?: string
  relationshipToHead?: string
  totalSpent: number
  totalTickets: number
  createdAt: number
  updatedAt: number
}

export type MockFamily = {
  _id: string
  name: string
  headCustomerId: string
  memberCount: number
  headCustomer?: MockCustomer
}

export type MockTransactionItem = {
  type: "ticket" | "package" | "addon"
  name: string
  priceTier?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type MockTransaction = {
  _id: string
  transactionNumber: string
  customer?: MockCustomer
  event?: MockEvent
  type: "purchase" | "refund" | "partial_refund"
  status: "pending" | "completed" | "failed" | "refunded" | "partially_refunded"
  items: MockTransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  refundedAmount?: number
  paymentMethod: "card" | "cash" | "bank_transfer" | "paypal" | "other"
  paymentReference?: string
  notes?: string
  source?: string
  createdAt: number
  updatedAt: number
}

export type MockPackage = {
  _id: string
  name: string
  description?: string
  type: "bundle" | "pass" | "addon"
  status: "active" | "inactive"
  bundleItems?: { priceTierName: string; quantity: number }[]
  includedEventIds?: string[]
  passValidDays?: number
  addonType?: string
  price: number
  originalPrice?: number
  eventId?: string
  isGlobal: boolean
  maxQuantity?: number
  totalAvailable?: number
  createdAt: number
  updatedAt: number
}

export type MockTicketTemplate = {
  _id: string
  name: string
  description?: string
  isDefault: boolean
  width: number
  height: number
  backgroundColor: string
  elements: any[]
  previewUrl?: string
  createdAt: number
  updatedAt: number
}

export type MockSavedReport = {
  _id: string
  name: string
  type: "sales" | "customers" | "events"
}

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const mockEvents: MockEvent[] = [
  {
    _id: "evt_001",
    name: "Summer Music Festival",
    description: "A full-day outdoor festival with three stages and local food vendors.",
    type: "physical",
    status: "published",
    venue: "Harbor Park",
    address: "200 Bay Street",
    city: "San Diego",
    country: "USA",
    startDate: now + 12 * day,
    endDate: now + 12 * day + 6 * 60 * 60 * 1000,
    recurrence: { type: "none" },
    capacity: 1500,
    isFree: false,
    priceTiers: [
      { name: "General Admission", price: 49 },
      { name: "VIP", price: 129 },
    ],
    tags: ["music", "outdoor"],
    createdAt: now - 20 * day,
    updatedAt: now - 3 * day,
  },
  {
    _id: "evt_002",
    name: "Creator Economy Summit",
    description: "A live conference for creators, founders, and brands.",
    type: "online",
    status: "published",
    onlinePlatform: "Zoom",
    onlineUrl: "https://example.com/creator-summit",
    startDate: now + 6 * day,
    endDate: now + 6 * day + 3 * 60 * 60 * 1000,
    recurrence: { type: "none" },
    isFree: true,
    priceTiers: [],
    tags: ["conference", "virtual"],
    createdAt: now - 14 * day,
    updatedAt: now - 2 * day,
  },
  {
    _id: "evt_003",
    name: "City Night Market",
    description: "Food, crafts, and live performances from local vendors.",
    type: "physical",
    status: "draft",
    venue: "Old Town Plaza",
    city: "Austin",
    country: "USA",
    startDate: now + 25 * day,
    endDate: now + 25 * day + 4 * 60 * 60 * 1000,
    recurrence: { type: "weekly" },
    capacity: 800,
    isFree: true,
    priceTiers: [],
    tags: ["market", "community"],
    createdAt: now - 7 * day,
    updatedAt: now - 1 * day,
  },
  {
    _id: "evt_004",
    name: "Wellness Retreat Weekend",
    description: "A two-day retreat focused on mindfulness and movement.",
    type: "physical",
    status: "published",
    venue: "Sage Ridge Lodge",
    city: "Sedona",
    country: "USA",
    startDate: now + 45 * day,
    endDate: now + 47 * day,
    recurrence: { type: "none" },
    capacity: 120,
    isFree: false,
    priceTiers: [
      { name: "Standard", price: 249 },
      { name: "Shared Room", price: 199 },
    ],
    tags: ["wellness"],
    createdAt: now - 30 * day,
    updatedAt: now - 5 * day,
  },
  {
    _id: "evt_005",
    name: "Design Systems Workshop",
    description: "Hands-on workshop on building scalable design systems.",
    type: "online",
    status: "published",
    onlinePlatform: "Teams",
    onlineUrl: "https://example.com/design-systems",
    startDate: now + 18 * day,
    endDate: now + 18 * day + 2 * 60 * 60 * 1000,
    recurrence: { type: "none" },
    capacity: 300,
    isFree: false,
    priceTiers: [
      { name: "Standard", price: 79 },
      { name: "Team Pass", price: 249 },
    ],
    tags: ["design", "workshop"],
    createdAt: now - 10 * day,
    updatedAt: now - 1 * day,
  },
]

export const mockCustomers: MockCustomer[] = [
  {
    _id: "cus_001",
    firstName: "Avery",
    lastName: "Nguyen",
    email: "avery.nguyen@example.com",
    phone: "+1 415 555 0198",
    dateOfBirth: now - 29 * 365 * day,
    age: 29,
    city: "San Francisco",
    country: "USA",
    totalSpent: 420,
    totalTickets: 5,
    createdAt: now - 120 * day,
    updatedAt: now - 10 * day,
  },
  {
    _id: "cus_002",
    firstName: "Jamal",
    lastName: "Harris",
    email: "jamal.harris@example.com",
    phone: "+1 212 555 0173",
    dateOfBirth: now - 35 * 365 * day,
    age: 35,
    city: "New York",
    country: "USA",
    totalSpent: 860,
    totalTickets: 9,
    createdAt: now - 200 * day,
    updatedAt: now - 4 * day,
  },
  {
    _id: "cus_003",
    firstName: "Priya",
    lastName: "Desai",
    email: "priya.desai@example.com",
    city: "Seattle",
    country: "USA",
    totalSpent: 190,
    totalTickets: 2,
    createdAt: now - 40 * day,
    updatedAt: now - 2 * day,
  },
  {
    _id: "cus_004",
    firstName: "Lucas",
    lastName: "Müller",
    email: "lucas.mueller@example.com",
    city: "Denver",
    country: "USA",
    totalSpent: 1250,
    totalTickets: 14,
    createdAt: now - 300 * day,
    updatedAt: now - 20 * day,
  },
]

export const mockFamilies: MockFamily[] = [
  {
    _id: "fam_001",
    name: "The Harris Family",
    headCustomerId: "cus_002",
    memberCount: 3,
  },
]

mockCustomers[1].familyId = "fam_001"
mockCustomers[1].relationshipToHead = "head"
mockCustomers[2].familyId = "fam_001"
mockCustomers[2].relationshipToHead = "child"

export const mockPackages: MockPackage[] = [
  {
    _id: "pkg_001",
    name: "Family Festival Pack",
    description: "Bundle of 4 tickets for the Summer Music Festival.",
    type: "bundle",
    status: "active",
    bundleItems: [
      { priceTierName: "General Admission", quantity: 4 },
    ],
    eventId: "evt_001",
    isGlobal: false,
    price: 160,
    originalPrice: 196,
    maxQuantity: 2,
    totalAvailable: 120,
    createdAt: now - 25 * day,
    updatedAt: now - 5 * day,
  },
  {
    _id: "pkg_002",
    name: "All-Access Pass",
    description: "Attend every online workshop this season.",
    type: "pass",
    status: "active",
    includedEventIds: ["evt_002", "evt_005"],
    passValidDays: 90,
    isGlobal: false,
    price: 199,
    originalPrice: 299,
    createdAt: now - 18 * day,
    updatedAt: now - 2 * day,
  },
  {
    _id: "pkg_003",
    name: "VIP Parking",
    type: "addon",
    status: "inactive",
    addonType: "Parking",
    isGlobal: true,
    price: 25,
    createdAt: now - 40 * day,
    updatedAt: now - 30 * day,
  },
]

export const mockTransactions: MockTransaction[] = [
  {
    _id: "tx_001",
    transactionNumber: "TRX-2026-1042",
    customer: mockCustomers[0],
    event: mockEvents[0],
    type: "purchase",
    status: "completed",
    items: [
      { type: "ticket", name: "General Admission", priceTier: "General Admission", quantity: 2, unitPrice: 49, totalPrice: 98 },
    ],
    subtotal: 98,
    discount: 0,
    tax: 7.84,
    total: 105.84,
    paymentMethod: "card",
    paymentReference: "ch_78UY2",
    createdAt: now - 3 * day,
    updatedAt: now - 3 * day,
  },
  {
    _id: "tx_002",
    transactionNumber: "TRX-2026-1047",
    customer: mockCustomers[1],
    event: mockEvents[1],
    type: "purchase",
    status: "completed",
    items: [
      { type: "ticket", name: "Virtual Pass", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paymentMethod: "paypal",
    createdAt: now - 8 * day,
    updatedAt: now - 8 * day,
  },
  {
    _id: "tx_003",
    transactionNumber: "TRX-2026-1052",
    customer: mockCustomers[3],
    event: mockEvents[4],
    type: "purchase",
    status: "pending",
    items: [
      { type: "ticket", name: "Team Pass", priceTier: "Team Pass", quantity: 1, unitPrice: 249, totalPrice: 249 },
    ],
    subtotal: 249,
    discount: 0,
    tax: 19.92,
    total: 268.92,
    paymentMethod: "bank_transfer",
    createdAt: now - 1 * day,
    updatedAt: now - 1 * day,
  },
  {
    _id: "tx_004",
    transactionNumber: "TRX-2026-1020",
    customer: mockCustomers[2],
    event: mockEvents[0],
    type: "refund",
    status: "refunded",
    items: [
      { type: "ticket", name: "VIP", priceTier: "VIP", quantity: 1, unitPrice: 129, totalPrice: 129 },
    ],
    subtotal: 129,
    discount: 0,
    tax: 10.32,
    total: 139.32,
    refundedAmount: 139.32,
    paymentMethod: "card",
    createdAt: now - 15 * day,
    updatedAt: now - 14 * day,
  },
]

export const mockTicketTemplates: MockTicketTemplate[] = [
  {
    _id: "tt_001",
    name: "Neon Night",
    description: "High contrast template for live events.",
    isDefault: false,
    width: 600,
    height: 250,
    backgroundColor: "#0f172a",
    elements: [],
    createdAt: now - 60 * day,
    updatedAt: now - 12 * day,
  },
]

export const mockSavedReports: MockSavedReport[] = [
  { _id: "rpt_001", name: "Q1 Sales Overview", type: "sales" },
  { _id: "rpt_002", name: "Top Customers", type: "customers" },
]

export const hydrateFamilies = (
  customers: MockCustomer[],
  families: MockFamily[]
) => {
  return families.map((family) => ({
    ...family,
    headCustomer: customers.find((c) => c._id === family.headCustomerId),
  }))
}

export const getEventStats = (events: MockEvent[]) => {
  const nowTs = Date.now()
  return {
    total: events.length,
    published: events.filter((e) => e.status === "published").length,
    draft: events.filter((e) => e.status === "draft").length,
    upcoming: events.filter((e) => e.startDate > nowTs && e.status === "published").length,
    physical: events.filter((e) => e.type === "physical").length,
    online: events.filter((e) => e.type === "online").length,
  }
}

export const getCustomerStats = (customers: MockCustomer[], families: MockFamily[]) => {
  return {
    total: customers.length,
    families: families.length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    totalTickets: customers.reduce((sum, c) => sum + c.totalTickets, 0),
  }
}

export const getPackageStats = (packages: MockPackage[]) => {
  return {
    total: packages.length,
    active: packages.filter((p) => p.status === "active").length,
  }
}

const inRange = (value: number, start?: number, end?: number) => {
  if (start && value < start) return false
  if (end && value > end) return false
  return true
}

export const getTransactionStats = (
  transactions: MockTransaction[],
  filters?: { startDate?: number; endDate?: number }
) => {
  const relevant = transactions.filter((tx) =>
    inRange(tx.createdAt, filters?.startDate, filters?.endDate)
  )
  const completed = relevant.filter((tx) => tx.status === "completed")
  const totalRevenue = completed.reduce((sum, tx) => sum + tx.total, 0)
  const totalRefunded = relevant.reduce(
    (sum, tx) => sum + (tx.refundedAmount || 0),
    0
  )

  const byPaymentMethod = completed.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + tx.total
    return acc
  }, {})

  return {
    totalRevenue,
    netRevenue: totalRevenue - totalRefunded,
    averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
    completedTransactions: completed.length,
    pendingTransactions: relevant.filter((tx) => tx.status === "pending").length,
    refundedTransactions: relevant.filter((tx) =>
      ["refunded", "partially_refunded"].includes(tx.status)
    ).length,
    totalRefunded,
    byPaymentMethod,
  }
}

export const getDailyStats = (transactions: MockTransaction[], days: number) => {
  const result: { date: number; revenue: number }[] = []
  const start = Date.now() - (days - 1) * day

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(start + i * day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + day)
    const revenue = transactions
      .filter(
        (tx) =>
          tx.status === "completed" &&
          tx.createdAt >= dayStart.getTime() &&
          tx.createdAt < dayEnd.getTime()
      )
      .reduce((sum, tx) => sum + tx.total, 0)
    result.push({ date: dayStart.getTime(), revenue })
  }
  return result
}

export const buildSalesReport = (
  transactions: MockTransaction[],
  filters: { startDate?: number; endDate?: number; groupBy: "day" | "paymentMethod" | "event" }
) => {
  const relevant = transactions.filter((tx) =>
    inRange(tx.createdAt, filters.startDate, filters.endDate)
  )
  const completed = relevant.filter((tx) => tx.status === "completed")

  const grouped = completed.reduce<Record<string, { revenue: number; transactions: number }>>(
    (acc, tx) => {
      let key = ""
      if (filters.groupBy === "day") {
        key = new Date(tx.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      } else if (filters.groupBy === "paymentMethod") {
        key = tx.paymentMethod.replace("_", " ")
      } else {
        key = tx.event?.name || "No event"
      }

      if (!acc[key]) acc[key] = { revenue: 0, transactions: 0 }
      acc[key].revenue += tx.total
      acc[key].transactions += 1
      return acc
    },
    {}
  )

  const groupedData = Object.entries(grouped).map(([label, data]) => ({
    date: filters.groupBy === "day" ? label : undefined,
    method: filters.groupBy === "paymentMethod" ? label : undefined,
    eventName: filters.groupBy === "event" ? label : undefined,
    revenue: data.revenue,
    transactions: data.transactions,
  }))

  const totalTickets = completed.reduce(
    (sum, tx) => sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  )

  const totalRevenue = completed.reduce((sum, tx) => sum + tx.total, 0)

  return {
    summary: {
      totalRevenue,
      totalTransactions: completed.length,
      averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
      totalTickets,
    },
    groupedData,
  }
}

export const buildCustomerReport = (customers: MockCustomer[], families: MockFamily[]) => {
  const totalCustomers = customers.length
  const familyAccounts = families.length
  const individualAccounts = totalCustomers - familyAccounts
  const repeatCustomers = customers.filter((c) => c.totalTickets > 1).length
  const newCustomers = customers.filter((c) => c.createdAt > Date.now() - 30 * day).length

  const ageGroups: Record<string, number> = {
    "0-12": 0,
    "13-17": 0,
    "18-25": 0,
    "26-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
    Unknown: 0,
  }

  customers.forEach((customer) => {
    const age = customer.age
    if (age === undefined) {
      ageGroups.Unknown += 1
      return
    }
    if (age <= 12) ageGroups["0-12"] += 1
    else if (age <= 17) ageGroups["13-17"] += 1
    else if (age <= 25) ageGroups["18-25"] += 1
    else if (age <= 35) ageGroups["26-35"] += 1
    else if (age <= 50) ageGroups["36-50"] += 1
    else if (age <= 65) ageGroups["51-65"] += 1
    else ageGroups["65+"] += 1
  })

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)

  return {
    summary: {
      totalCustomers,
      familyAccounts,
      individualAccounts,
      repeatCustomers,
      newCustomers,
    },
    ageGroups,
    topCustomers,
  }
}
