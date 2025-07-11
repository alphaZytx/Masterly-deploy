"use client"

// app/about/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Target, Award, ArrowLeft, Mail, Phone, MapPin, ArrowRight, Brain, CheckCircle, TrendingUp, Lightbulb, FileText, PlayCircle, BarChart3, Zap, UserCheck, GitBranch } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function AboutPage() {
  const [activeFlow, setActiveFlow] = useState('learning')
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [animatingSteps, setAnimatingSteps] = useState<Record<number, boolean>>({})

  const learningFlow = [
    {
      step: 1,
      title: 'Course Discovery',
      description: 'Browse courses or get AI recommendations based on your goals',
      detailedDescription: 'Our AI analyzes your background, goals, and learning preferences to suggest the perfect courses for your journey.',
      icon: BookOpen,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      step: 2,
      title: 'Personalized Path',
      description: 'AI creates a custom learning roadmap using knowledge graphs',
      detailedDescription: 'Advanced algorithms map out prerequisite concepts and create a personalized learning sequence tailored to your pace.',
      icon: Brain,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      step: 3,
      title: 'Interactive Learning',
      description: 'Engage with video content, assignments, and practical projects',
      detailedDescription: 'Learn through hands-on projects, interactive exercises, and real-world applications that reinforce concepts.',
      icon: PlayCircle,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      step: 4,
      title: 'Concept Mastery',
      description: 'Take adaptive quizzes that test understanding, not memorization',
      detailedDescription: 'Smart assessments adapt to your responses, focusing on areas that need improvement and celebrating your progress.',
      icon: Target,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      step: 5,
      title: 'Feedback & Growth',
      description: 'Receive personalized insights and recommendations for improvement',
      detailedDescription: 'Get detailed analytics on your learning patterns with actionable recommendations for continued growth.',
      icon: TrendingUp,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600'
    }
  ];

  const courseDesignFlow = [
    {
      step: 1,
      title: 'Expert Knowledge',
      description: 'Industry experts share real-world experience and structured content',
      detailedDescription: 'Connect with experienced professionals who bring real-world insights and practical knowledge to every lesson.',
      icon: Lightbulb,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600'
    },
    {
      step: 2,
      title: 'Content Structuring',
      description: 'AI organizes content into logical learning modules and dependencies',
      detailedDescription: 'Intelligent systems analyze expert content and structure it into logical, progressive learning modules.',
      icon: FileText,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600'
    },
    {
      step: 3,
      title: 'Knowledge Mapping',
      description: 'Create interconnected concept graphs for personalized pathways',
      detailedDescription: 'Build complex knowledge networks that show how concepts connect, enabling truly personalized learning paths.',
      icon: GitBranch,
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600'
    },
    {
      step: 4,
      title: 'Assessment Design',
      description: 'Generate concept-driven quizzes that adapt to learner performance',
      detailedDescription: 'Create intelligent assessments that understand what learners know and adapt questions to challenge appropriately.',
      icon: BarChart3,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600'
    },
    {
      step: 5,
      title: 'Continuous Optimization',
      description: 'AI analyzes learning patterns to improve course effectiveness',
      detailedDescription: 'Machine learning continuously analyzes learner data to optimize course content and improve learning outcomes.',
      icon: Zap,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    }
  ];

  const currentFlow = activeFlow === 'learning' ? learningFlow : courseDesignFlow;

  const handleStepClick = (stepNumber: number) => {
    setAnimatingSteps(prev => ({
      ...prev,
      [stepNumber]: true
    }));
    
    // Reset animation after 600ms
    setTimeout(() => {
      setAnimatingSteps(prev => ({
        ...prev,
        [stepNumber]: false
      }));
    }, 600);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Personalization',
      description: 'Knowledge graphs adapt to your learning style and pace',
      stat: '95% learner satisfaction'
    },
    {
      icon: Target,
      title: 'Mastery-Based Learning',
      description: 'Progress only when you truly understand the concepts',
      stat: '40% faster skill acquisition'
    },
    {
      icon: UserCheck,
      title: 'Expert-Curated Content',
      description: 'Learn from industry professionals with real-world experience',
      stat: '500+ expert instructors'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Improvement',
      description: 'Personalized feedback helps you grow with every lesson',
      stat: '3x better retention rate'
    }
  ];

  const stats = [
    { number: "2025", label: "Founded" },
    { number: "1500+", label: "Active Students" },
    { number: "50+", label: "Courses" },
    { number: "95%", label: "Success Rate" }
  ]

  const values = [
    {
      icon: Target,
      title: "Personalized Learning",
      description: "We believe every learner is unique and deserves a customized educational experience."
    },
    {
      icon: Users,
      title: "Community First",
      description: "Building a supportive community where learners help each other grow and succeed."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering the highest quality content and learning experiences."
    }
  ]

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
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">🎯 About Masterly</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Empowering Learners
              <br />
              Worldwide
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Founded in 2025, Masterly has been at the forefront of personalized education technology. 
              We're on a mission to make quality education accessible to everyone, everywhere.
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

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              To democratize education through AI-powered personalization, making learning more effective, 
              engaging, and accessible for millions of learners worldwide. We believe that when education 
              adapts to the individual, extraordinary things happen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Masterly Works Section - FIXED SMOOTH ANIMATIONS */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              🔄 How It Works
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              The Masterly Learning Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From discovery to mastery, our AI-powered platform guides you through 
              a personalized learning journey designed for real-world success.
            </p>
          </div>

          {/* Flow Type Selector */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <Button
                variant={activeFlow === 'learning' ? 'default' : 'ghost'}
                onClick={() => setActiveFlow('learning')}
                className="mr-1 transition-all duration-300"
              >
                Learning Journey
              </Button>
              <Button
                variant={activeFlow === 'course' ? 'default' : 'ghost'}
                onClick={() => setActiveFlow('course')}
                className="transition-all duration-300"
              >
                Course Creation
              </Button>
            </div>
          </div>

          {/* Enhanced Interactive Flowchart - FIXED ANIMATIONS */}
          <div className="relative mb-16">
            <div className="grid md:grid-cols-5 gap-8 items-stretch">
              {currentFlow.map((step, index) => (
                <div key={step.step} className="relative flex">
                  <Card 
                    className={`flex-1 text-center border-2 cursor-pointer group overflow-hidden
                      transform-gpu transition-all duration-300 ease-in-out will-change-transform
                      ${hoveredStep === step.step 
                        ? 'border-blue-400 shadow-2xl scale-[1.02] bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:scale-[1.01]'
                      }
                      ${animatingSteps[step.step] ? 'animate-pulse' : ''}
                      dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-400
                    `}
                    onMouseEnter={() => setHoveredStep(step.step)}
                    onMouseLeave={() => setHoveredStep(null)}
                    onClick={() => handleStepClick(step.step)}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 
                      transition-opacity duration-500 ease-in-out
                      ${hoveredStep === step.step ? 'opacity-100' : 'opacity-0'}
                    `} />
                    
                    <CardHeader className="pb-4 relative z-10">
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 
                        shadow-lg transition-all duration-300 ease-in-out transform-gpu will-change-transform
                        ${hoveredStep === step.step 
                          ? 'scale-110 rotate-3 shadow-xl' 
                          : 'scale-100 rotate-0'
                        }`}>
                        <step.icon className={`w-8 h-8 text-white transition-transform duration-300 ease-in-out
                          ${hoveredStep === step.step ? 'scale-110' : 'scale-100'}
                        `} />
                      </div>
                      <div className={`text-sm font-bold mb-2 transition-colors duration-300 ease-in-out
                        ${hoveredStep === step.step 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        STEP {step.step}
                      </div>
                      <CardTitle className={`text-lg transition-colors duration-300 ease-in-out
                        ${hoveredStep === step.step 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-white'
                        }`}>
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="min-h-[80px] flex items-center justify-center">
                        <p className={`text-sm transition-all duration-300 ease-in-out ${
                          hoveredStep === step.step 
                            ? 'text-gray-700 dark:text-gray-200' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {hoveredStep === step.step ? step.detailedDescription : step.description}
                        </p>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${step.color} rounded-full transition-all duration-700 ease-in-out ${
                            hoveredStep === step.step ? 'w-full' : 'w-0'
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Enhanced smooth arrow connector */}
                  {index < currentFlow.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20 items-center">
                      <div className="relative flex items-center">
                        {/* Connecting line */}
                        <div className={`w-6 h-0.5 transition-all duration-500 ease-in-out ${
                          hoveredStep === step.step || hoveredStep === step.step + 1
                            ? 'bg-blue-500 shadow-lg' 
                            : 'bg-blue-300'
                        }`} />
                        
                        {/* Arrow */}
                        <div className={`relative ml-1 transition-all duration-500 ease-in-out transform-gpu will-change-transform ${
                          hoveredStep === step.step || hoveredStep === step.step + 1
                            ? 'text-blue-500 scale-125 translate-x-1' 
                            : 'text-blue-400 scale-100 translate-x-0'
                        }`}>
                          <ArrowRight className="w-5 h-5" />
                          
                          {/* Glow effect on hover */}
                          <div className={`absolute inset-0 w-5 h-5 rounded-full transition-all duration-500 ease-in-out ${
                            hoveredStep === step.step || hoveredStep === step.step + 1
                              ? 'bg-blue-500/20 animate-pulse' 
                              : 'bg-transparent'
                          }`} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900 group">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-blue-600 font-semibold text-lg">
                    {feature.stat}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Graph Technology Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              Knowledge Graph Technology
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our AI creates interconnected learning paths that adapt to your progress, 
              ensuring you build knowledge systematically and efficiently.
            </p>
          </div>

          <Card className="p-8 shadow-2xl dark:bg-gray-900 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prerequisites</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Automatically identify and fill knowledge gaps before advancing
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Adaptive Learning</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Content difficulty adjusts based on your performance and understanding
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mastery Tracking</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Real-time assessment of concept understanding and skill development
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-2xl dark:bg-gray-900">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Our Story</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
                <p className="mb-6">
                  Masterly was born from a real need: learners today are overwhelmed with content, yet still struggle 
                  without clear guidance. Our team of five passionate developers came together with a shared goal — to 
                  build a platform that truly helps learners grow, not just consume.
                </p>
                <p className="mb-6">
                  While working on the problem statement of Personalized Learning Path Recommendation using Knowledge Graphs, 
                  we realized the key was giving learners a clear, intelligent roadmap. We built an AI-powered platform where 
                  instructors can share their real-world knowledge, and learners can follow a guided, customizable path.
                </p>
                <p className="mb-6">
                  What sets Masterly apart is our mastery-based approach: after each course, learners take concept-driven 
                  quizzes that provide personalized feedback and help them improve with every step. We're here to bridge the 
                  gap between learning and application — and this is just the beginning.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Have questions about our mission? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>hello@masterly.com</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>India</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/help">Contact Support</Link>
            </Button>
          </div>
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
  )
}