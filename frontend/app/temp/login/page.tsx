"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Loader2, Home } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Debug logging
  console.log("AdminLoginPage component rendered")
  console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      // Check for network or server error before parsing JSON
      if (!response.ok) {
        let errMsg = "Authentication failed";
        try {
          const data = await response.json();
          errMsg = data.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.role !== "admin") {
        throw new Error("Unauthorized access");
      }

      // Optionally, remove the sessionCheck if your backend sets the cookie correctly
      // and /admin/profile is protected.
      // Use window.location to ensure complete refresh and cookie processing
      window.location.href = data.redirectUrl || "/admin";
      
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Home Button - Top Left */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-2">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Admin Login
          </CardTitle>
          <Badge className="mt-2 bg-purple-100 text-purple-700">
            Restricted Access
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="email"
              type="email"
              placeholder="Admin Email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}