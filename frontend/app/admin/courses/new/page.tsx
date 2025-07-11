"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Upload, Plus, X, ArrowLeft, Video, FileText, Brain, Code } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewCourse() {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    price: "",
    thumbnail: "",
    tags: [] as string[],
    isPublished: false,
  })

  const [concepts, setConcepts] = useState([{ id: 1, title: "", type: "video", content: "", order: 1 }])

  const [currentTag, setCurrentTag] = useState("")

  const addTag = () => {
    if (currentTag && !courseData.tags.includes(currentTag)) {
      setCourseData({
        ...courseData,
        tags: [...courseData.tags, currentTag],
      })
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCourseData({
      ...courseData,
      tags: courseData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const addConcept = () => {
    setConcepts([
      ...concepts,
      {
        id: concepts.length + 1,
        title: "",
        type: "video",
        content: "",
        order: concepts.length + 1,
      },
    ])
  }

  const removeConcept = (id: number) => {
    setConcepts(concepts.filter((concept) => concept.id !== id))
  }

  const getConceptIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "article":
        return <FileText className="w-4 h-4" />
      case "quiz":
        return <Brain className="w-4 h-4" />
      case "problem":
        return <Code className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
            <p className="text-gray-600 dark:text-gray-300">Build an engaging learning experience</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Save as Draft</Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Publish Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                  <CardDescription>Basic details about your course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter course title"
                      value={courseData.title}
                      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn"
                      rows={4}
                      value={courseData.description}
                      onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={courseData.category}
                        onValueChange={(value) => setCourseData({ ...courseData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="computer-science">Computer Science</SelectItem>
                          <SelectItem value="web-development">Web Development</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                          <SelectItem value="ai-ml">AI/ML</SelectItem>
                          <SelectItem value="mobile-development">Mobile Development</SelectItem>
                          <SelectItem value="devops">DevOps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={courseData.difficulty}
                        onValueChange={(value) => setCourseData({ ...courseData, difficulty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={courseData.price}
                      onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        placeholder="Add a tag"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button type="button" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {courseData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">Publish immediately</Label>
                    <Switch
                      id="published"
                      checked={courseData.isPublished}
                      onCheckedChange={(checked) => setCourseData({ ...courseData, isPublished: checked })}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Course will be visible to students immediately after creation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>Add concepts, videos, articles, and quizzes</CardDescription>
                </div>
                <Button onClick={addConcept}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Concept
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {concepts.map((concept, index) => (
                  <Card key={concept.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {getConceptIcon(concept.type)}
                          <span className="font-medium">Concept {index + 1}</span>
                        </div>
                        {concepts.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeConcept(concept.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input placeholder="Concept title" />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select defaultValue="video">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Video Lecture</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="problem">Coding Problem</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Content</Label>
                        <Textarea placeholder="Add content details, video URL, or article text" rows={3} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>Configure advanced course options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Comments</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Downloads</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Certificate on Completion</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Require Prerequisites</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Time-based Access</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-enroll in Learning Path</Label>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
