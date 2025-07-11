"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Video,
  ImageIcon,
  FileText,
  Music,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminMedia() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const mediaFiles = [
    {
      id: "1",
      name: "intro-to-algorithms.mp4",
      type: "video",
      size: "245 MB",
      uploadDate: "2024-01-15",
      usedIn: ["Data Structures Course", "Algorithm Basics"],
      thumbnail: "/placeholder.svg?height=120&width=160",
    },
    {
      id: "2",
      name: "system-design-diagram.png",
      type: "image",
      size: "2.3 MB",
      uploadDate: "2024-01-14",
      usedIn: ["System Design Course"],
      thumbnail: "/placeholder.svg?height=120&width=160",
    },
    {
      id: "3",
      name: "react-patterns-lecture.mp4",
      type: "video",
      size: "189 MB",
      uploadDate: "2024-01-12",
      usedIn: ["React Advanced Course"],
      thumbnail: "/placeholder.svg?height=120&width=160",
    },
    {
      id: "4",
      name: "ml-cheatsheet.pdf",
      type: "document",
      size: "1.8 MB",
      uploadDate: "2024-01-10",
      usedIn: ["Machine Learning Course"],
      thumbnail: "/placeholder.svg?height=120&width=160",
    },
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-blue-600" />
      case "image":
        return <ImageIcon className="w-5 h-5 text-green-600" />
      case "document":
        return <FileText className="w-5 h-5 text-red-600" />
      case "audio":
        return <Music className="w-5 h-5 text-purple-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      video: "bg-blue-100 text-blue-800",
      image: "bg-green-100 text-green-800",
      document: "bg-red-100 text-red-800",
      audio: "bg-purple-100 text-purple-800",
    }
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Library</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your course media files</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+23 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2 GB</div>
            <p className="text-xs text-muted-foreground">of 100 GB limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">27% of total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">789</div>
            <p className="text-xs text-muted-foreground">63% of total files</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Media Files</CardTitle>
              <CardDescription>Browse and manage your uploaded content</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mediaFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
                    {file.type === "video" || file.type === "image" ? (
                      <img
                        src={file.thumbnail || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getFileIcon(file.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className="font-medium text-sm mb-1 truncate">{file.name}</h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{file.size}</span>
                      <span>{file.uploadDate}</span>
                    </div>
                    {getTypeBadge(file.type)}
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Used in {file.usedIn.length} course{file.usedIn.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.type)}
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {file.size} • {file.uploadDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getTypeBadge(file.type)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {file.usedIn.length} course{file.usedIn.length !== 1 ? "s" : ""}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
