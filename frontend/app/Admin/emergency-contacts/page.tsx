"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  Phone,
  Mail,
  User,
  Calendar,
  Search,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

interface EmergencyContact {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'pending' | 'successful'
  createdAt: string
  updatedAt: string
}

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/emergency-contacts`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch emergency contacts")
      }

      const data = await response.json()
      setContacts(data)
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to fetch emergency contacts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmergencyContacts()
  }, [])

  const updateContactStatus = async (contactId: string, newStatus: 'new' | 'pending' | 'successful') => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/emergency-contacts/${contactId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      // Update the contact in the local state
      setContacts(prev => prev.map(contact => 
        contact._id === contactId 
          ? { ...contact, status: newStatus }
          : contact
      ))

      // Close modal if open
      if (showModal) {
        setShowModal(false)
        setSelectedContact(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    }
  }

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const newContacts = filteredContacts.filter(contact => contact.status === 'new')
  const pendingContacts = filteredContacts.filter(contact => contact.status === 'pending')
  const successfulContacts = filteredContacts.filter(contact => contact.status === 'successful')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'successful': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'successful': return <CheckCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  if (loading && contacts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-lg text-gray-500 dark:text-gray-400">
                Loading emergency contacts...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Emergency Contacts & Help Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage help requests and emergency contacts from users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Requests
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {contacts.length}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                New Requests
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {newContacts.length}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingContacts.length}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Successful
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {successfulContacts.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search contacts
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={fetchEmergencyContacts}
              variant="outline"
              className="md:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Three Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* New Requests */}
          <div className="space-y-4">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700 border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-900/20">
                <CardTitle className="flex items-center text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  New Requests
                  <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {newContacts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {newContacts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No new requests
                  </p>
                ) : (
                  newContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => {
                        setSelectedContact(contact)
                        setShowModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-red-900 dark:text-red-300 text-sm">
                          {contact.name}
                        </h4>
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusIcon(contact.status)}
                          <span className="ml-1 text-xs">{contact.status}</span>
                        </Badge>
                      </div>
                      <p className="text-red-800 dark:text-red-400 text-xs mb-2">
                        {contact.subject}
                      </p>
                      <p className="text-red-700 dark:text-red-500 text-xs">
                        {formatDate(contact.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <div className="space-y-4">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
                <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    {pendingContacts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingContacts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  pendingContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                      onClick={() => {
                        setSelectedContact(contact)
                        setShowModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm">
                          {contact.name}
                        </h4>
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusIcon(contact.status)}
                          <span className="ml-1 text-xs">{contact.status}</span>
                        </Badge>
                      </div>
                      <p className="text-yellow-800 dark:text-yellow-400 text-xs mb-2">
                        {contact.subject}
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-500 text-xs">
                        {formatDate(contact.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Successful Requests */}
          <div className="space-y-4">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Successful
                  <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {successfulContacts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {successfulContacts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No successful requests
                  </p>
                ) : (
                  successfulContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                      onClick={() => {
                        setSelectedContact(contact)
                        setShowModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-green-900 dark:text-green-300 text-sm">
                          {contact.name}
                        </h4>
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusIcon(contact.status)}
                          <span className="ml-1 text-xs">{contact.status}</span>
                        </Badge>
                      </div>
                      <p className="text-green-800 dark:text-green-400 text-xs mb-2">
                        {contact.subject}
                      </p>
                      <p className="text-green-700 dark:text-green-500 text-xs">
                        {formatDate(contact.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Detail Modal */}
        {showModal && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Contact Details
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedContact(null)
                    }}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Name
                      </Label>
                      <p className="text-gray-900 dark:text-white">{selectedContact.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Email
                      </Label>
                      <p className="text-gray-900 dark:text-white">{selectedContact.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Subject
                    </Label>
                    <p className="text-gray-900 dark:text-white">{selectedContact.subject}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Message
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedContact.message}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Created
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(selectedContact.createdAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Status
                      </Label>
                      <Badge className={`mt-1 ${getStatusColor(selectedContact.status)}`}>
                        {getStatusIcon(selectedContact.status)}
                        <span className="ml-1">{selectedContact.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => updateContactStatus(selectedContact._id, 'pending')}
                      disabled={selectedContact.status === 'pending'}
                      className="flex-1"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Mark Pending
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateContactStatus(selectedContact._id, 'successful')}
                      disabled={selectedContact.status === 'successful'}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Successful
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
