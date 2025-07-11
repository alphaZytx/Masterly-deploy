"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/auth"
import apiClient from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Send,
} from "lucide-react"

export default function HelpPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [helpRequest, setHelpRequest] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "medium",
  })

  const handleSubmitHelpRequest = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/emergency-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user?.profile?.fullName || user?.email || "Anonymous",
          email: user?.email || "",
          subject: `${helpRequest.category}: ${helpRequest.subject}`,
          message: `Priority: ${helpRequest.priority}\n\n${helpRequest.description}`,
          status: "new"
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit help request")
      }

      setSuccess("Help request submitted successfully! We'll get back to you soon.")
      setHelpRequest({
        category: "",
        subject: "",
        description: "",
        priority: "medium",
      })
      toast({
        title: "Help Request Submitted",
        description: "Your help request has been submitted. We'll respond within 24 hours.",
      })
    } catch (err: any) {
      setError(err.message || "Failed to submit help request")
      toast({
        title: "Error",
        description: err.message || "Failed to submit help request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading help center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Help Center</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get help with your learning journey. We'll respond to your request within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Help Request Form */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Get Help
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Submit a help request and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={helpRequest.category}
                      onValueChange={(value) => setHelpRequest({ ...helpRequest, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Payment</SelectItem>
                        <SelectItem value="course">Course Content</SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={helpRequest.priority}
                      onValueChange={(value) => setHelpRequest({ ...helpRequest, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={helpRequest.subject}
                    onChange={(e) => setHelpRequest({ ...helpRequest, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={helpRequest.description}
                    onChange={(e) => setHelpRequest({ ...helpRequest, description: e.target.value })}
                    placeholder="Please provide detailed information about your issue..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleSubmitHelpRequest} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Help Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Help Section */}
          <div className="space-y-6">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quick Help</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Common questions and quick solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">How to reset password?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Go to login page and click "Forgot Password"
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/login">Reset Password</a>
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Course not loading?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Try refreshing the page or clear browser cache
                    </p>
                    <Button variant="outline" size="sm">Clear Cache</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Payment issues?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Check your payment method or contact support
                    </p>
                    <Button variant="outline" size="sm">Contact Support</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">support@masterly.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}