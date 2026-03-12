"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { StatsCard } from "@/components/admin/stats-card"
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  UsersRound,
  DollarSign,
  Ticket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MockCustomer, MockFamily } from "@/lib/mock-data"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"

interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  country: string
  postalCode: string
  notes: string
  familyId: string
  relationshipToHead: string
}

const initialFormData: CustomerFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  city: "",
  country: "",
  postalCode: "",
  notes: "",
  familyId: "",
  relationshipToHead: "",
}

const relationships = ["head", "spouse", "child", "parent", "sibling", "other"]

export default function CustomersPage() {
  const {
    data: customers = [],
    isLoading: customersLoading,
    refresh: refreshCustomers,
  } = useLiveData<MockCustomer[]>("/api/customers", { interval: 12000 })

  const {
    data: familyRecords = [],
    refresh: refreshFamilies,
  } = useLiveData<MockFamily[]>("/api/families", { interval: 12000 })

  const families = useMemo(() => {
    return familyRecords.map((family) => ({
      ...family,
      memberCount: customers.filter((c) => c.familyId === family._id).length,
      headCustomer: customers.find((c) => c._id === family.headCustomerId),
    }))
  }, [customers, familyRecords])

  const customerStats = useMemo(() => {
    return {
      total: customers.length,
      families: families.length,
      totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      totalTickets: customers.reduce((sum, c) => sum + c.totalTickets, 0),
    }
  }, [customers, families])

  const [activeTab, setActiveTab] = useState("customers")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [familyName, setFamilyName] = useState("")
  const [familyHeadId, setFamilyHeadId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleCreate = () => {
    setSelectedCustomer(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const handleEdit = (customerId: string) => {
    const customer = customers?.find((c) => c._id === customerId)
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || "",
        dateOfBirth: customer.dateOfBirth
          ? new Date(customer.dateOfBirth).toISOString().split("T")[0]
          : "",
        address: customer.address || "",
        city: customer.city || "",
        country: customer.country || "",
        postalCode: customer.postalCode || "",
        notes: customer.notes || "",
        familyId: customer.familyId || "",
        relationshipToHead: customer.relationshipToHead || "",
      })
      setSelectedCustomer(customerId)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (customerId: string) => {
    setSelectedCustomer(customerId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedCustomer) {
      try {
        await apiRequest(`/api/customers/${selectedCustomer}`, { method: "DELETE" })
        refreshCustomers()
        toast.success("Customer deleted successfully")
      } catch (error) {
        toast.error("Failed to delete customer")
        console.error("[CustomersPage] Delete error:", error)
      }
    }
    setIsDeleteDialogOpen(false)
    setSelectedCustomer(null)
  }

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : undefined

      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).getTime()
          : undefined,
        age: age || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        postalCode: formData.postalCode || undefined,
        notes: formData.notes || undefined,
        familyId: formData.familyId || undefined,
        relationshipToHead: formData.relationshipToHead || undefined,
      }

      if (selectedCustomer) {
        await apiRequest(`/api/customers/${selectedCustomer}`, {
          method: "PUT",
          body: customerData,
        })
        refreshCustomers()
        toast.success("Customer updated successfully")
      } else {
        await apiRequest("/api/customers", {
          method: "POST",
          body: customerData,
        })
        refreshCustomers()
        toast.success("Customer created successfully")
      }

      setIsDialogOpen(false)
      setFormData(initialFormData)
      setSelectedCustomer(null)
    } catch (error) {
      toast.error("Failed to save customer")
      console.error("[CustomersPage] Save error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFamily = async () => {
    if (!familyName || !familyHeadId) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      await apiRequest("/api/families", {
        method: "POST",
        body: {
          name: familyName,
          headCustomerId: familyHeadId,
        },
      })
      refreshFamilies()
      refreshCustomers()
      toast.success("Family created successfully")
      setIsFamilyDialogOpen(false)
      setFamilyName("")
      setFamilyHeadId("")
    } catch (error) {
      toast.error("Failed to create family")
      console.error("[CustomersPage] Create family error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const customerColumns: Column<any>[] = [
    {
      key: "name",
      header: "Customer",
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="gradient-bg text-white">
              {getInitials(customer.firstName, customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (customer) => (
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </div>
          )}
          {customer.city && (
            <div className="text-sm text-muted-foreground">
              {customer.city}, {customer.country}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "age",
      header: "Age",
      cell: (customer) => (
        <div>
          {customer.age ? (
            <>
              <p className="font-medium">{customer.age} years</p>
              {customer.dateOfBirth && (
                <p className="text-sm text-muted-foreground">
                  {new Date(customer.dateOfBirth).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: "family",
      header: "Family",
      cell: (customer) => {
        const family = families?.find((f) => f._id === customer.familyId)
        return customer.familyId ? (
          <div>
            <p className="font-medium">{family?.name || "Family"}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {customer.relationshipToHead || "Member"}
            </p>
          </div>
        ) : (
          <StatusBadge status="Individual" type="default" />
        )
      },
    },
    {
      key: "stats",
      header: "Activity",
      cell: (customer) => (
        <div>
          <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-sm text-muted-foreground">{customer.totalTickets} tickets</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(customer._id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(customer._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers"
        description="Manage individual customers and family accounts"
        icon={Users}
        action={{
          label: "Add Customer",
          onClick: handleCreate,
          icon: UserPlus,
        }}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={customerStats?.total || 0}
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Family Accounts"
          value={customerStats?.families || 0}
          icon={UsersRound}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(customerStats?.totalSpent || 0)}
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Total Tickets"
          value={customerStats?.totalTickets || 0}
          icon={Ticket}
          iconColor="text-cyan-500"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="customers">All Customers</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
          </TabsList>
          {activeTab === "families" && (
            <Button onClick={() => setIsFamilyDialogOpen(true)} variant="outline">
              <UsersRound className="mr-2 h-4 w-4" />
              Create Family
            </Button>
          )}
        </div>

        <TabsContent value="customers" className="mt-6">
          {!customersLoading && customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add your first customer to start tracking purchases"
              action={{
                label: "Add Customer",
                onClick: handleCreate,
              }}
            />
          ) : (
            <DataTable
              columns={customerColumns}
              data={customers || []}
              searchPlaceholder="Search customers..."
              searchKey="firstName"
          isLoading={customersLoading}
        />
          )}
        </TabsContent>

        <TabsContent value="families" className="mt-6">
          {families.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No families yet"
              description="Create a family account to group customers together"
              action={{
                label: "Create Family",
                onClick: () => setIsFamilyDialogOpen(true),
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {families.map((family) => (
                <Card key={family._id} className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-bg">
                        <UsersRound className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{family.name}</p>
                        <p className="text-sm font-normal text-muted-foreground">
                          {family.memberCount} members
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {family.headCustomer && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Head:</span>
                          <span>
                            {family.headCustomer.firstName} {family.headCustomer.lastName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {family.headCustomer?.email}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {selectedCustomer
                ? "Update the customer details below"
                : "Fill in the details to add a new customer"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                {formData.dateOfBirth && (
                  <p className="text-sm text-muted-foreground">
                    Age: {calculateAge(formData.dateOfBirth)} years
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium">Address</h4>
              <div className="grid gap-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            {/* Family */}
            {families.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Family</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Family</Label>
                    <Select
                      value={formData.familyId || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, familyId: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select family (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No family</SelectItem>
                        {families.map((family) => (
                          <SelectItem key={family._id} value={family._id}>
                            {family.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.familyId && (
                    <div className="grid gap-2">
                      <Label>Relationship</Label>
                      <Select
                        value={formData.relationshipToHead}
                        onValueChange={(value) =>
                          setFormData({ ...formData, relationshipToHead: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((rel) => (
                            <SelectItem key={rel} value={rel} className="capitalize">
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="gradient-bg">
              {isLoading ? "Saving..." : selectedCustomer ? "Update" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Family Dialog */}
      <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Family</DialogTitle>
            <DialogDescription>
              Create a new family account and assign a head of family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., The Smith Family"
              />
            </div>
            <div className="grid gap-2">
              <Label>Head of Family</Label>
              <Select
                value={familyHeadId}
                onValueChange={(value) => setFamilyHeadId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head of family" />
                </SelectTrigger>
                <SelectContent>
                  {customers
                    ?.filter((c) => !c.familyId)
                    .map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFamilyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFamily} disabled={isLoading} className="gradient-bg">
              {isLoading ? "Creating..." : "Create Family"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
