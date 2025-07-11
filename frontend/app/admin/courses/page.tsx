"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Star,
  TrendingUp,
  Target,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from 'react';

type Concept = { conceptId: string; title: string };
type Course = { _id: string; title: string; concepts: Concept[] };

const PAGE_SIZE = 10;

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${baseUrl}/admin/courses-with-concepts`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCourses(data.data || []));
  }, []);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setPage(1);
    setSortAsc(true);
  };

  const sortedConcepts = selectedCourse ? [...selectedCourse.concepts].sort((a, b) => {
    if (sortAsc) return a.title.localeCompare(b.title);
    return b.title.localeCompare(a.title);
  }) : [];
  const paginatedConcepts = sortedConcepts.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = selectedCourse ? Math.ceil(selectedCourse.concepts.length / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-4">Course Management</h1>
      {/* Horizontal scrollable courses */}
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {courses.map(course => (
          <div
            key={course._id}
            className={`min-w-[200px] p-4 rounded-lg border cursor-pointer transition-all ${selectedCourse && selectedCourse._id === course._id ? 'bg-blue-100 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
            onClick={() => handleCourseClick(course)}
          >
            <div className="font-semibold text-lg mb-2">{course.title}</div>
            <div className="text-xs text-gray-500">{course.concepts.length} concepts</div>
          </div>
        ))}
      </div>
      {/* Concepts list for selected course */}
      {selectedCourse && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Concept Titles</h2>
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={() => setSortAsc(s => !s)}
            >
              Sort: {sortAsc ? 'A-Z' : 'Z-A'}
            </button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Concept ID</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConcepts.map((concept, idx) => (
                  <tr key={concept.conceptId} className="border-t">
                    <td className="px-4 py-2">{(page-1)*PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-2">{concept.title}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{concept.conceptId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
            >Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
