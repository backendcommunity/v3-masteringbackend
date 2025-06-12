"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin, Twitter, Linkedin, Github, Globe, Grid, List, Filter } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"

// Mock author data
const authorData = {
  "sarah-ahmed": {
    name: "Sarah Ahmed",
    avatar: "SA",
    title: "Senior Backend Engineer at Google",
    bio: "Sarah is a passionate backend engineer with 8+ years of experience building scalable distributed systems. She specializes in Python, microservices architecture, and cloud-native technologies. Sarah has led multiple high-impact projects at Google and is an active contributor to open-source projects.",
    location: "San Francisco, CA",
    joinedDate: "2022-03-15",
    social: {
      twitter: "@sarahdev",
      linkedin: "sarah-ahmed-dev",
      github: "sarahdev",
      website: "https://sarahahmed.dev",
    },
    stats: {
      articles: 24,
      courses: 3,
      followers: 15420,
      totalViews: 2500000,
    },
    expertise: ["Python", "FastAPI", "Django", "Microservices", "AWS", "Docker", "Kubernetes"],
    posts: [
      {
        id: 1,
        title: "Building Scalable REST APIs with Python and FastAPI",
        excerpt:
          "Learn how to create production-ready REST APIs using FastAPI, including authentication, database integration, and deployment strategies.",
        category: "Python",
        publishedAt: "2024-01-15",
        readTime: "8 min read",
        type: "article",
        views: 45200,
        likes: 342,
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 2,
        title: "Python Backend Mastery Course",
        excerpt:
          "Complete course covering Django, FastAPI, database design, and deployment. Build 5 real-world projects.",
        category: "Python",
        publishedAt: "2024-01-10",
        readTime: "40 hours",
        type: "course",
        views: 12800,
        likes: 156,
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 3,
        title: "Microservices Communication Patterns",
        excerpt:
          "Explore different communication patterns between microservices including synchronous, asynchronous, and event-driven approaches.",
        category: "Architecture",
        publishedAt: "2024-01-05",
        readTime: "12 min read",
        type: "article",
        views: 28900,
        likes: 234,
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 4,
        title: "Docker for Python Developers",
        excerpt:
          "Complete guide to containerizing Python applications with Docker, including best practices and optimization techniques.",
        category: "DevOps",
        publishedAt: "2023-12-28",
        readTime: "15 min read",
        type: "article",
        views: 38700,
        likes: 298,
        image: "/placeholder.svg?height=300&width=400",
      },
    ],
  },
}

export default function AuthorPage({ params }: { params: { author: string } }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [contentFilter, setContentFilter] = useState<"all" | "articles" | "courses">("all")

  const author = authorData[params.author as keyof typeof authorData]

  if (!author) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Author Not Found</h1>
          <Link href="/blog" className="text-[#13AECE] dark:text-[#0EA5E9] hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const filteredPosts = author.posts.filter((post) => {
    if (contentFilter === "all") return true
    if (contentFilter === "articles") return post.type === "article"
    if (contentFilter === "courses") return post.type === "course"
    return true
  })

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0F1C] transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-md border-b border-[#97C3CC]/20 dark:border-[#475569]/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <BrandLogo size="md" showText={true} variant="default" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Home
              </Link>
              <Link href="/blog" className="text-[#13AECE] dark:text-[#0EA5E9] font-medium">
                Blog
              </Link>
              <Link
                href="/courses"
                className="text-[#0E1F33]/70 hover:text-[#0E1F33] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Courses
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Back to Blog */}
      <div className="pt-20 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog</span>
          </Link>
        </div>
      </div>

      {/* Author Profile */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#97C3CC]/10 via-[#E8F4F8]/50 to-white dark:from-[#1E293B]/30 dark:via-[#0F172A]/50 dark:to-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Author Info */}
            <div className="lg:col-span-1">
              <div className="glass-card p-8 rounded-2xl sticky top-24">
                {/* Avatar and Basic Info */}
                <div className="text-center mb-6">
                  <div className="w-32 h-32 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-4xl">{author.avatar}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">{author.name}</h1>
                  <p className="text-[#13AECE] dark:text-[#0EA5E9] font-medium mb-2">{author.title}</p>
                  <div className="flex items-center justify-center space-x-2 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{author.location}</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <p className="text-[#0E1F33]/80 dark:text-[#CBD5E1] leading-relaxed">{author.bio}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">{author.stats.articles}</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Articles</div>
                  </div>
                  <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">{author.stats.courses}</div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Courses</div>
                  </div>
                  <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">
                      {author.stats.followers.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg">
                    <div className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">
                      {(author.stats.totalViews / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">Total Views</div>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-3">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {author.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 text-[#13AECE] dark:text-[#0EA5E9] px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-3">Connect</h3>
                  <div className="flex space-x-3">
                    <a
                      href={`https://twitter.com/${author.social.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href={`https://linkedin.com/in/${author.social.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href={`https://github.com/${author.social.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href={author.social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg flex items-center justify-center hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Member Since */}
                <div className="text-center pt-6 border-t border-[#97C3CC]/20 dark:border-[#475569]/20">
                  <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                    Member since{" "}
                    {new Date(author.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Author's Content */}
            <div className="lg:col-span-2">
              {/* Content Header */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                    Content by {author.name}
                  </h2>
                  <p className="text-[#0E1F33]/60 dark:text-[#94A3B8]">
                    {filteredPosts.length} item{filteredPosts.length !== 1 ? "s" : ""} found
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={contentFilter}
                    onChange={(e) => setContentFilter(e.target.value as "all" | "articles" | "courses")}
                    className="bg-white dark:bg-[#1E293B] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg px-3 py-2 text-[#0E1F33] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9]"
                  >
                    <option value="all">All Content</option>
                    <option value="articles">Articles Only</option>
                    <option value="courses">Courses Only</option>
                  </select>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-[#13AECE] dark:bg-[#0EA5E9] text-white"
                          : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-[#13AECE] dark:bg-[#0EA5E9] text-white"
                          : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Grid/List */}
              {viewMode === "grid" ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={post.type === "course" ? `/courses/${post.id}` : `/blog/${post.id}`}
                      className="group"
                    >
                      <article className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                        <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 relative overflow-hidden">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                                post.type === "course"
                                  ? "bg-[#0E1F33] dark:bg-[#475569]"
                                  : "bg-[#13AECE] dark:bg-[#0EA5E9]"
                              }`}
                            >
                              {post.type === "course" ? "Course" : "Article"}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center space-x-4 mb-3">
                            <Link
                              href={`/blog/category/${post.category.toLowerCase()}`}
                              className="text-[#13AECE] dark:text-[#0EA5E9] text-sm font-medium hover:underline"
                            >
                              {post.category}
                            </Link>
                            <div className="flex items-center space-x-2 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#0E1F33]/60 dark:text-[#94A3B8]">
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-4 text-[#0E1F33]/60 dark:text-[#94A3B8]">
                              <span>{post.views.toLocaleString()} views</span>
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={post.type === "course" ? `/courses/${post.id}` : `/blog/${post.id}`}
                      className="group"
                    >
                      <article className="glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/3">
                            <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 rounded-lg overflow-hidden relative">
                              <img
                                src={post.image || "/placeholder.svg"}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                                    post.type === "course"
                                      ? "bg-[#0E1F33] dark:bg-[#475569]"
                                      : "bg-[#13AECE] dark:bg-[#0EA5E9]"
                                  }`}
                                >
                                  {post.type === "course" ? "Course" : "Article"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="md:w-2/3">
                            <div className="flex items-center space-x-4 mb-3">
                              <Link
                                href={`/blog/category/${post.category.toLowerCase()}`}
                                className="text-[#13AECE] dark:text-[#0EA5E9] text-sm font-medium hover:underline"
                              >
                                {post.category}
                              </Link>
                              <div className="flex items-center space-x-2 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4 line-clamp-2">{post.excerpt}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-[#0E1F33]/60 dark:text-[#94A3B8]">
                                <span>{post.views.toLocaleString()} views</span>
                                <span>{post.likes} likes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Filter className="w-12 h-12 text-[#0E1F33]/40 dark:text-[#94A3B8]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">No content found</h3>
                  <p className="text-[#0E1F33]/60 dark:text-[#94A3B8] mb-6">
                    Try adjusting your filters to find what you're looking for.
                  </p>
                  <button
                    onClick={() => setContentFilter("all")}
                    className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors"
                  >
                    Show All Content
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0E1F33] dark:bg-[#0A0F1C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Follow {author.name}</h2>
          <p className="text-white/80 dark:text-[#CBD5E1] mb-8 max-w-2xl mx-auto">
            Stay updated with {author.name}'s latest articles, courses, and insights on backend development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 dark:bg-[#1E293B] border border-white/20 dark:border-[#475569]/20 rounded-lg text-white placeholder-white/60 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent"
            />
            <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors whitespace-nowrap">
              Follow
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
