"use client"

import { useState, useRef, useCallback } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { EmptyState } from "@/components/admin/empty-state"
import {
  Ticket,
  Plus,
  Save,
  Copy,
  Trash2,
  Type,
  Image,
  QrCode,
  Square,
  Circle,
  Minus,
  Calendar,
  Clock,
  MapPin,
  Hash,
  User,
  Tag,
  DollarSign,
  Palette,
  Move,
  RotateCw,
  Eye,
  Grid,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { MockTicketTemplate } from "@/lib/mock-data"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"

type ElementType = "text" | "image" | "qrcode" | "barcode" | "eventName" | "eventDate" | "eventTime" | "eventLocation" | "ticketNumber" | "customerName" | "ticketType" | "price" | "shape" | "line"

interface TicketElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  content?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  color?: string
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  rotation?: number
  opacity?: number
  textAlign?: string
  zIndex?: number
}

interface TicketTemplate {
  name: string
  description: string
  width: number
  height: number
  backgroundColor: string
  elements: TicketElement[]
}

const defaultTemplate: TicketTemplate = {
  name: "",
  description: "",
  width: 600,
  height: 250,
  backgroundColor: "#1a1a2e",
  elements: [],
}

const elementTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "eventName", label: "Event Name", icon: Ticket },
  { type: "eventDate", label: "Event Date", icon: Calendar },
  { type: "eventTime", label: "Event Time", icon: Clock },
  { type: "eventLocation", label: "Location", icon: MapPin },
  { type: "ticketNumber", label: "Ticket #", icon: Hash },
  { type: "customerName", label: "Customer Name", icon: User },
  { type: "ticketType", label: "Ticket Type", icon: Tag },
  { type: "price", label: "Price", icon: DollarSign },
  { type: "qrcode", label: "QR Code", icon: QrCode },
  { type: "shape", label: "Rectangle", icon: Square },
  { type: "line", label: "Line", icon: Minus },
]

const presetTemplates = [
  {
    name: "Modern Dark",
    backgroundColor: "#1a1a2e",
    elements: [
      {
        id: "1",
        type: "shape",
        x: 0,
        y: 0,
        width: 600,
        height: 250,
        backgroundColor: "#16213e",
        borderRadius: 12,
      },
      {
        id: "2",
        type: "eventName",
        x: 30,
        y: 30,
        width: 350,
        height: 40,
        fontSize: 28,
        fontWeight: "bold",
        color: "#ffffff",
      },
      {
        id: "3",
        type: "eventDate",
        x: 30,
        y: 80,
        width: 200,
        height: 24,
        fontSize: 16,
        color: "#9ca3af",
      },
      {
        id: "4",
        type: "eventLocation",
        x: 30,
        y: 110,
        width: 200,
        height: 24,
        fontSize: 16,
        color: "#9ca3af",
      },
      {
        id: "5",
        type: "customerName",
        x: 30,
        y: 170,
        width: 250,
        height: 24,
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffff",
      },
      {
        id: "6",
        type: "ticketType",
        x: 30,
        y: 200,
        width: 150,
        height: 24,
        fontSize: 14,
        color: "#a78bfa",
      },
      {
        id: "7",
        type: "qrcode",
        x: 480,
        y: 30,
        width: 100,
        height: 100,
        backgroundColor: "#ffffff",
      },
      {
        id: "8",
        type: "ticketNumber",
        x: 430,
        y: 200,
        width: 150,
        height: 20,
        fontSize: 12,
        color: "#6b7280",
        textAlign: "right",
      },
    ],
  },
  {
    name: "Gradient Premium",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    elements: [
      {
        id: "1",
        type: "shape",
        x: 0,
        y: 0,
        width: 600,
        height: 250,
        backgroundColor: "transparent",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.2)",
      },
      {
        id: "2",
        type: "text",
        x: 30,
        y: 20,
        width: 100,
        height: 24,
        content: "PREMIUM",
        fontSize: 12,
        fontWeight: "bold",
        color: "#fbbf24",
      },
      {
        id: "3",
        type: "eventName",
        x: 30,
        y: 50,
        width: 400,
        height: 45,
        fontSize: 32,
        fontWeight: "bold",
        color: "#ffffff",
      },
      {
        id: "4",
        type: "line",
        x: 30,
        y: 110,
        width: 200,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.3)",
      },
      {
        id: "5",
        type: "eventDate",
        x: 30,
        y: 130,
        width: 200,
        height: 24,
        fontSize: 16,
        color: "#ffffff",
      },
      {
        id: "6",
        type: "eventLocation",
        x: 30,
        y: 160,
        width: 250,
        height: 24,
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
      },
      {
        id: "7",
        type: "customerName",
        x: 30,
        y: 200,
        width: 250,
        height: 30,
        fontSize: 20,
        fontWeight: "bold",
        color: "#ffffff",
      },
      {
        id: "8",
        type: "qrcode",
        x: 470,
        y: 50,
        width: 110,
        height: 110,
        backgroundColor: "#ffffff",
        borderRadius: 8,
      },
      {
        id: "9",
        type: "price",
        x: 470,
        y: 180,
        width: 110,
        height: 30,
        fontSize: 24,
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
      },
    ],
  },
  {
    name: "Minimal White",
    backgroundColor: "#ffffff",
    elements: [
      {
        id: "1",
        type: "shape",
        x: 0,
        y: 0,
        width: 600,
        height: 250,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      },
      {
        id: "2",
        type: "eventName",
        x: 30,
        y: 30,
        width: 350,
        height: 35,
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
      },
      {
        id: "3",
        type: "eventDate",
        x: 30,
        y: 75,
        width: 200,
        height: 20,
        fontSize: 14,
        color: "#6b7280",
      },
      {
        id: "4",
        type: "eventLocation",
        x: 30,
        y: 100,
        width: 250,
        height: 20,
        fontSize: 14,
        color: "#6b7280",
      },
      {
        id: "5",
        type: "line",
        x: 30,
        y: 140,
        width: 350,
        height: 1,
        backgroundColor: "#e5e7eb",
      },
      {
        id: "6",
        type: "customerName",
        x: 30,
        y: 160,
        width: 200,
        height: 25,
        fontSize: 16,
        fontWeight: "bold",
        color: "#111827",
      },
      {
        id: "7",
        type: "ticketType",
        x: 30,
        y: 190,
        width: 100,
        height: 20,
        fontSize: 12,
        color: "#7c3aed",
        fontWeight: "bold",
      },
      {
        id: "8",
        type: "ticketNumber",
        x: 30,
        y: 215,
        width: 200,
        height: 16,
        fontSize: 10,
        color: "#9ca3af",
      },
      {
        id: "9",
        type: "qrcode",
        x: 470,
        y: 75,
        width: 100,
        height: 100,
        backgroundColor: "#000000",
      },
    ],
  },
]

export default function TicketDesignerPage() {
  const {
    data: templates = [],
    refresh: refreshTemplates,
  } = useLiveData<MockTicketTemplate[]>("/api/ticket-templates", { interval: 12000 })

  const [activeView, setActiveView] = useState<"list" | "editor">("list")
  const [template, setTemplate] = useState<TicketTemplate>(defaultTemplate)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const canvasRef = useRef<HTMLDivElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const addElement = (type: ElementType) => {
    const newElement: TicketElement = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === "qrcode" ? 100 : type === "line" ? 200 : 150,
      height: type === "qrcode" ? 100 : type === "line" ? 2 : 30,
      content: type === "text" ? "Sample Text" : undefined,
      fontSize: type === "line" ? undefined : 16,
      fontWeight: "normal",
      fontFamily: "Inter",
      color: "#ffffff",
      backgroundColor: type === "shape" || type === "qrcode" ? "#374151" : undefined,
      borderRadius: 0,
      opacity: 100,
      textAlign: "left",
      zIndex: template.elements.length,
    }

    setTemplate({
      ...template,
      elements: [...template.elements, newElement],
    })
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<TicketElement>) => {
    setTemplate({
      ...template,
      elements: template.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })
  }

  const deleteElement = (id: string) => {
    setTemplate({
      ...template,
      elements: template.elements.filter((el) => el.id !== id),
    })
    setSelectedElement(null)
  }

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (!canvasRef.current) return
    
    const element = template.elements.find((el) => el.id === elementId)
    if (!element) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = rect.width / template.width
    
    setDragOffset({
      x: e.clientX - rect.left - element.x * scale,
      y: e.clientY - rect.top - element.y * scale,
    })
    setSelectedElement(elementId)
    setIsDragging(true)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedElement || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scale = rect.width / template.width

      const newX = Math.max(0, Math.min(template.width - 50, (e.clientX - rect.left - dragOffset.x) / scale))
      const newY = Math.max(0, Math.min(template.height - 20, (e.clientY - rect.top - dragOffset.y) / scale))

      updateElement(selectedElement, { x: Math.round(newX), y: Math.round(newY) })
    },
    [isDragging, selectedElement, dragOffset, template.width, template.height]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const loadPreset = (preset: typeof presetTemplates[0]) => {
    setTemplate({
      ...template,
      backgroundColor: preset.backgroundColor,
      elements: preset.elements.map((el) => ({ ...el, id: generateId() })),
    })
    toast.success(`Loaded "${preset.name}" template`)
  }

  const handleCreateNew = () => {
    setSelectedTemplateId(null)
    setTemplate(defaultTemplate)
    setActiveView("editor")
  }

  const handleEditTemplate = (id: string) => {
    const existing = templates?.find((t) => t._id === id)
    if (existing) {
      setSelectedTemplateId(id)
      setTemplate({
        name: existing.name,
        description: existing.description || "",
        width: existing.width,
        height: existing.height,
        backgroundColor: existing.backgroundColor,
        elements: existing.elements as TicketElement[],
      })
      setActiveView("editor")
    }
  }

  const handleSave = async () => {
    if (!template.name) {
      setIsNameDialogOpen(true)
      return
    }

    setIsLoading(true)
    try {
      if (selectedTemplateId) {
        await apiRequest(`/api/ticket-templates/${selectedTemplateId}`, {
          method: "PUT",
          body: {
            name: template.name,
            description: template.description,
            isDefault: false,
            width: template.width,
            height: template.height,
            backgroundColor: template.backgroundColor,
            elements: template.elements,
          },
        })
        refreshTemplates()
        toast.success("Template updated successfully")
      } else {
        await apiRequest("/api/ticket-templates", {
          method: "POST",
          body: {
            name: template.name,
            description: template.description,
            isDefault: false,
            width: template.width,
            height: template.height,
            backgroundColor: template.backgroundColor,
            elements: template.elements,
          },
        })
        refreshTemplates()
        toast.success("Template created successfully")
      }
      setActiveView("list")
    } catch (error) {
      toast.error("Failed to save template")
      console.error("[TicketDesigner] Save error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplateId) return

    try {
        await apiRequest(`/api/ticket-templates/${selectedTemplateId}`, { method: "DELETE" })
        refreshTemplates()
        toast.success("Template deleted")
      setIsDeleteDialogOpen(false)
      setActiveView("list")
    } catch (error) {
      toast.error("Failed to delete template")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const original = templates.find((t) => t._id === id)
      if (!original) return
      await apiRequest("/api/ticket-templates", {
        method: "POST",
        body: {
          name: `${original.name} (Copy)`,
          description: original.description,
          isDefault: false,
          width: original.width,
          height: original.height,
          backgroundColor: original.backgroundColor,
          elements: original.elements,
        },
      })
      refreshTemplates()
      toast.success("Template duplicated")
    } catch (error) {
      toast.error("Failed to duplicate template")
    }
  }

  const getElementLabel = (type: string, content?: string) => {
    switch (type) {
      case "eventName": return "Summer Music Festival"
      case "eventDate": return "Saturday, July 15, 2026"
      case "eventTime": return "7:00 PM"
      case "eventLocation": return "Central Park, New York"
      case "ticketNumber": return "#TKT-2024-001"
      case "customerName": return "John Smith"
      case "ticketType": return "VIP Access"
      case "price": return "$99.00"
      case "text": return content || "Sample Text"
      default: return ""
    }
  }

  const selectedElementData = selectedElement
    ? template.elements.find((el) => el.id === selectedElement)
    : null

  // List View
  if (activeView === "list") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Ticket Designer"
          description="Create and manage custom ticket templates"
          icon={Ticket}
          action={{
            label: "New Template",
            onClick: handleCreateNew,
          }}
        />

        {/* Preset Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {presetTemplates.map((preset, index) => (
                <div
                  key={index}
                  onClick={() => {
                    loadPreset(preset)
                    setActiveView("editor")
                  }}
                  className="cursor-pointer rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <div
                    className="aspect-[2.4] rounded-lg mb-3"
                    style={{
                      background: preset.backgroundColor,
                    }}
                  />
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preset.elements.length} elements
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Saved Templates */}
        {templates.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No saved templates"
            description="Create your first ticket template or start with a preset"
            action={{
              label: "Create Template",
              onClick: handleCreateNew,
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <div
                    key={t._id}
                    className="rounded-lg border border-border overflow-hidden card-hover"
                  >
                    <div
                      className="aspect-[2.4]"
                      style={{ backgroundColor: t.backgroundColor }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.elements.length} elements
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(t._id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(t._id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplateId(t._id)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Editor View
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setActiveView("list")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {template.name || "New Template"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {template.elements.length} elements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowGrid(!showGrid)}>
            <Grid className="mr-2 h-4 w-4" />
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gradient-bg">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Sidebar - Elements */}
        <Card className="w-64 shrink-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Add Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-2">
                {elementTypes.map((el) => (
                  <Button
                    key={el.type}
                    variant="outline"
                    className="h-auto flex-col py-3 px-2"
                    onClick={() => addElement(el.type as ElementType)}
                  >
                    <el.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{el.label}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-secondary/30 rounded-lg p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: template.width,
              height: template.height,
              background: template.backgroundColor,
              backgroundImage: showGrid
                ? `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`
                : undefined,
              backgroundSize: showGrid ? "20px 20px" : undefined,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedElement(null)}
          >
            {template.elements.map((element) => (
              <div
                key={element.id}
                className={cn(
                  "absolute cursor-move select-none",
                  selectedElement === element.id && "ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                )}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  backgroundColor: element.backgroundColor,
                  borderRadius: element.borderRadius,
                  borderWidth: element.borderWidth,
                  borderColor: element.borderColor,
                  borderStyle: element.borderWidth ? "solid" : undefined,
                  opacity: (element.opacity || 100) / 100,
                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                  zIndex: element.zIndex,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, element.id)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {element.type === "qrcode" ? (
                  <div className="w-full h-full flex items-center justify-center bg-white rounded">
                    <QrCode className="w-3/4 h-3/4 text-black" />
                  </div>
                ) : element.type === "line" ? (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: element.backgroundColor || element.color }}
                  />
                ) : element.type === "shape" ? null : (
                  <div
                    className="w-full h-full flex items-center"
                    style={{
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      textAlign: element.textAlign as any,
                      justifyContent:
                        element.textAlign === "center"
                          ? "center"
                          : element.textAlign === "right"
                            ? "flex-end"
                            : "flex-start",
                    }}
                  >
                    {getElementLabel(element.type, element.content)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <Card className="w-72 shrink-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              {selectedElementData ? "Element Properties" : "Canvas Properties"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[500px]">
              {selectedElementData ? (
                <div className="space-y-4">
                  {/* Position */}
                  <div className="space-y-2">
                    <Label className="text-xs">Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">X</Label>
                        <Input
                          type="number"
                          value={selectedElementData.x}
                          onChange={(e) =>
                            updateElement(selectedElement!, { x: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Y</Label>
                        <Input
                          type="number"
                          value={selectedElementData.y}
                          onChange={(e) =>
                            updateElement(selectedElement!, { y: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Width</Label>
                        <Input
                          type="number"
                          value={selectedElementData.width}
                          onChange={(e) =>
                            updateElement(selectedElement!, { width: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Height</Label>
                        <Input
                          type="number"
                          value={selectedElementData.height}
                          onChange={(e) =>
                            updateElement(selectedElement!, { height: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Content */}
                  {selectedElementData.type === "text" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Content</Label>
                      <Input
                        value={selectedElementData.content || ""}
                        onChange={(e) =>
                          updateElement(selectedElement!, { content: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {/* Typography */}
                  {!["shape", "line", "qrcode"].includes(selectedElementData.type) && (
                    <div className="space-y-2">
                      <Label className="text-xs">Typography</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Font Size</Label>
                          <Input
                            type="number"
                            value={selectedElementData.fontSize || 16}
                            onChange={(e) =>
                              updateElement(selectedElement!, {
                                fontSize: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Font Weight</Label>
                          <Select
                            value={selectedElementData.fontWeight || "normal"}
                            onValueChange={(value) =>
                              updateElement(selectedElement!, { fontWeight: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="semibold">Semibold</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Text Align</Label>
                          <Select
                            value={selectedElementData.textAlign || "left"}
                            onValueChange={(value) =>
                              updateElement(selectedElement!, { textAlign: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Color</Label>
                          <Input
                            type="color"
                            value={selectedElementData.color || "#ffffff"}
                            onChange={(e) =>
                              updateElement(selectedElement!, { color: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background */}
                  {["shape", "line"].includes(selectedElementData.type) && (
                    <div className="space-y-2">
                      <Label className="text-xs">Background</Label>
                      <Input
                        type="color"
                        value={selectedElementData.backgroundColor || "#374151"}
                        onChange={(e) =>
                          updateElement(selectedElement!, { backgroundColor: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {/* Border Radius */}
                  {["shape", "qrcode"].includes(selectedElementData.type) && (
                    <div className="space-y-2">
                      <Label className="text-xs">Border Radius</Label>
                      <Slider
                        value={[selectedElementData.borderRadius || 0]}
                        max={50}
                        step={1}
                        onValueChange={([value]) =>
                          updateElement(selectedElement!, { borderRadius: value })
                        }
                      />
                    </div>
                  )}

                  {/* Opacity */}
                  <div className="space-y-2">
                    <Label className="text-xs">Opacity ({selectedElementData.opacity || 100}%)</Label>
                    <Slider
                      value={[selectedElementData.opacity || 100]}
                      max={100}
                      step={1}
                      onValueChange={([value]) =>
                        updateElement(selectedElement!, { opacity: value })
                      }
                    />
                  </div>

                  {/* Delete */}
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteElement(selectedElement!)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Element
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Canvas Size */}
                  <div className="space-y-2">
                    <Label className="text-xs">Canvas Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Width</Label>
                        <Input
                          type="number"
                          value={template.width}
                          onChange={(e) =>
                            setTemplate({ ...template, width: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Height</Label>
                        <Input
                          type="number"
                          value={template.height}
                          onChange={(e) =>
                            setTemplate({ ...template, height: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label className="text-xs">Background Color</Label>
                    <Input
                      type="color"
                      value={template.backgroundColor.startsWith("#") ? template.backgroundColor : "#1a1a2e"}
                      onChange={(e) =>
                        setTemplate({ ...template, backgroundColor: e.target.value })
                      }
                    />
                  </div>

                  {/* Elements List */}
                  <div className="space-y-2">
                    <Label className="text-xs">Elements ({template.elements.length})</Label>
                    <div className="space-y-1">
                      {template.elements.map((el, index) => (
                        <div
                          key={el.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2 cursor-pointer",
                            selectedElement === el.id
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          )}
                          onClick={() => setSelectedElement(el.id)}
                        >
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs capitalize flex-1">{el.type}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteElement(el.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Name Dialog */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Give your template a name before saving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Template Name</Label>
              <Input
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="e.g., Modern Event Ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Describe this template..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsNameDialogOpen(false)
                handleSave()
              }}
              disabled={!template.name}
              className="gradient-bg"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
