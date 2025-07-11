"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Users, Rocket, Globe, Heart, Code, Palette, BookOpen, Brain, Target, CheckCircle, Lightbulb, ArrowRight, MapPin, Phone } from 'lucide-react';
import Link from "next/link"

export default function CareersPage() {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  const whyJoinReasons = [
    {
      icon: Users,
      title: 'Passionate Team',
      description: 'Work with passionate, creative minds who share your vision for transforming education',
      stat: '10+ core team members',
      color: 'from-pink-400 to-pink-600'
    },
    {
      icon: Rocket,
      title: 'Impactful Work',
      description: 'Build impactful educational tools that make a real difference in learners\' lives worldwide',
      stat: '1500+ students impacted',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: Globe,
      title: 'Remote-Friendly',
      description: 'Remote-friendly & flexible work culture that adapts to your lifestyle and preferences',
      stat: '100% remote options',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: Heart,
      title: 'Real Ownership',
      description: 'Real ownership of your work with the freedom to innovate and create meaningful solutions',
      stat: 'Full creative freedom',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const teamRoles = [
    {
      role: 'developers',
      title: 'Developers',
      description: 'Building the future of personalized learning technology',
      icon: Code,
      color: 'from-blue-400 to-blue-600',
      skills: ['React/Next.js', 'Node.js', 'AI/ML', 'Database Design']
    },
    {
      role: 'educators',
      title: 'Educators',
      description: 'Designing effective learning experiences and curricula',
      icon: BookOpen,
      color: 'from-green-400 to-green-600',
      skills: ['Curriculum Design', 'Learning Psychology', 'Content Strategy', 'Assessment']
    },
    {
      role: 'designers',
      title: 'Designers',
      description: 'Creating intuitive and beautiful user experiences',
      icon: Palette,
      color: 'from-purple-400 to-purple-600',
      skills: ['UI/UX Design', 'User Research', 'Prototyping', 'Design Systems']
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: 'Continuous Learning',
      description: 'Access to courses, conferences, and learning resources'
    },
    {
      icon: Target,
      title: 'Goal-Oriented Culture',
      description: 'Clear objectives with meaningful impact measurement'
    },
    {
      icon: CheckCircle,
      title: 'Work-Life Balance',
      description: 'Flexible hours and unlimited PTO policy'
    },
    {
      icon: Lightbulb,
      title: 'Innovation Time',
      description: '20% time for personal projects and experimentation'
    }
  ];

  const stats = [
    { number: "2025", label: "Founded" },
    { number: "10+", label: "Team Members" },
    { number: "1500+", label: "Students Served" },
    { number: "100%", label: "Remote Friendly" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Masterly
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              🚀 Join Our Mission
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Revolutionize Learning
              <br />
              With Us
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              We're building the future of education and need passionate people like you. 
              At Masterly, we're a growing team of developers, educators, and designers working to 
              make personalized learning accessible to everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Openings Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
              🚧 Current Openings
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Join Our Growing Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded font-semibold text-gray-900 dark:text-white">
                We're not hiring right now
              </span>, but we're always excited to hear from talented individuals
              who share our passion for transforming education.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-2xl dark:bg-gray-900 border-2 border-orange-200 dark:border-orange-800">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Make an Impact?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Send us your resume and we'll get in touch when a suitable opportunity arises.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                      📧 Send your resume to:
                    </p>
                    <a 
                      href="mailto:careers@masterly.com" 
                      className="text-2xl font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      careers@masterly.com
                    </a>
                  </div>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=careers@masterly.com" target="_blank" rel="noopener noreferrer">
                      <Mail className="w-5 h-5 mr-2" />
                      Get in Touch
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Roles Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're looking for passionate individuals across different disciplines to join our mission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {teamRoles.map((role, index) => (
              <Card 
                key={index} 
                className={`text-center border-2 cursor-pointer group transition-all duration-300 dark:bg-gray-900
                  ${hoveredRole === role.role 
                    ? 'border-blue-400 shadow-2xl scale-105 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:scale-102'
                  }
                `}
                onMouseEnter={() => setHoveredRole(role.role)}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <CardHeader>
                  <div className={`w-20 h-20 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center mx-auto mb-4 
                    shadow-lg transition-all duration-300 transform-gpu
                    ${hoveredRole === role.role ? 'scale-110 rotate-3 shadow-xl' : 'scale-100 rotate-0'}
                  `}>
                    <role.icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {role.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Why Join Masterly?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're building something special, and we want you to be part of the journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyJoinReasons.map((reason, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900 group">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${reason.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <reason.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {reason.title}
                  </CardTitle>
                  <CardDescription className="text-blue-600 font-semibold text-lg">
                    {reason.stat}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Benefits & Perks
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We believe in taking care of our team so they can do their best work.
            </p>
          </div>

          <Card className="p-8 shadow-2xl dark:bg-gray-900 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Masterly</span>
              </div>
              <p className="text-gray-400">Empowering learners worldwide with personalized education technology.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/learning-paths" className="hover:text-white transition-colors">Learning Paths</Link></li>
                <li><Link href="/mock-tests" className="hover:text-white transition-colors">Mock Tests</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Masterly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}