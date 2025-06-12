"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, TagIcon, Grid, List } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Pagination } from "@/components/pagination"

// Mock data for tag content
const tagData = {
  fastapi: {
    name: "FastAPI",
    description: "Modern, fast web framework for building APIs with Python based on standard Python type hints.",
    relatedTags: ["Python", "REST API", "Backend", "Authentication"],
    posts: [
      {
        id: 1,
        title: "Building Scalable REST APIs with Python and FastAPI",
        excerpt:
          "Learn how to create production-ready REST APIs using FastAPI, including authentication, database integration, and deployment strategies.",
        author: { name: "Sarah Ahmed", avatar: "SA" },
        category: "Python",
        publishedAt: "2024-01-15",
        readTime: "8 min read",
        type: "article",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 2,
        title: "FastAPI Advanced Features Course",
        excerpt:
          "Master advanced FastAPI features including dependency injection, middleware, background tasks, and testing.",
        author: { name: "Michael Johnson", avatar: "MJ" },
        category: "Python",
        publishedAt: "2024-01-12",
        readTime: "25 hours",
        type: "course",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 3,
        title: "FastAPI vs Django: Performance Comparison",
        excerpt: "Detailed performance analysis comparing FastAPI and Django for different use cases and workloads.",
        author: { name: "Emily Park", avatar: "EP" },
        category: "Python",
        publishedAt: "2024-01-10",
        readTime: "10 min read",
        type: "article",
        image: "/placeholder.svg?height=300&width=400",
      },
    ],
  },
  "rest-api": {
    name: "REST API",
    description: "Representational State Transfer - architectural style for designing networked applications.",
    relatedTags: ["API Design", "HTTP", "Backend", "Microservices"],
    posts: [
      {
        id: 1,
        title: "Building Scalable REST APIs with Python and FastAPI",
        excerpt:
          "Learn how to create production-ready REST APIs using FastAPI, including authentication, database integration, and deployment strategies.",
        author: { name: "Sarah Ahmed", avatar: "SA" },
        category: "Python",
        publishedAt: "2024-01-15",
        readTime: "8 min read",
        type: "article",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 4,
        title: "REST API Design Best Practices",
        excerpt:
          "Comprehensive guide to designing RESTful APIs with proper resource naming, HTTP methods, and status codes.",
        author: { name: "David Liu", avatar: "DL" },
        category: "API Design",
        publishedAt: "2024-01-08",
        readTime: "12 min read",
        type: "article",
        image: "/placeholder.svg?height=300&width=400",
      },
    ],
  },
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [contentFilter, setContentFilter] = useState<"all" | "articles" | "courses">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  const tag = tagData[params.tag as keyof typeof tagData]

  if (!tag) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Tag Not Found</h1>
          <Link href="/blog" className="text-[#13AECE] dark:text-[#0EA5E9] hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const filteredPosts = tag.posts.filter((post) => {
    if (contentFilter === "all") return true
    if (contentFilter === "articles") return post.type === "article"
    if (contentFilter === "courses") return post.type === "course"
    return true
  })

  const totalPosts = filteredPosts.length
  const totalPages = Math.ceil(totalPosts / postsPerPage)
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)

  const handleFilterChange = (newFilter: "all" | "articles" | "courses") => {
    setContentFilter(newFilter)
    setCurrentPage(1) // Reset to the first page when the filter changes
  }

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

      {/* Tag Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#97C3CC]/10 via-[#E8F4F8]/50 to-white dark:from-[#1E293B]/30 dark:via-[#0F172A]/50 dark:to-[#0A0F1C]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-2xl flex items-center justify-center">
              <TagIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0E1F33] dark:text-[#F1F5F9]">#{tag.name}</h1>
              <p className="text-xl text-[#0E1F33]/70 dark:text-[#94A3B8] mt-2">{tag.description}</p>
            </div>
          </div>

          {/* Related Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Related Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tag.relatedTags.map((relatedTag) => (
                <Link
                  key={relatedTag}
                  href={`/blog/tag/${relatedTag.toLowerCase().replace(" ", "-")}`}
                  className="flex items-center space-x-1 bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] px-3 py-2 rounded-lg hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>{relatedTag}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-[#0E1F33] dark:text-[#F1F5F9] font-medium">Show:</span>
                <select
                  value={contentFilter}
                  onChange={(e) => handleFilterChange(e.target.value as "all" | "articles" | "courses")}
                  className="bg-white dark:bg-[#1E293B] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg px-3 py-2 text-[#0E1F33] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9]"
                >
                  <option value="all">All Content</option>
                  <option value="articles">Articles Only</option>
                  <option value="courses">Courses Only</option>
                </select>
              </div>
              <div className="text-[#0E1F33]/60 dark:text-[#94A3B8]">
                {filteredPosts.length} item{filteredPosts.length !== 1 ? "s" : ""} found
              </div>
            </div>

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
      </section>

      {/* Content Grid/List */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
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
                            post.type === "course" ? "bg-[#0E1F33] dark:bg-[#475569]" : "bg-[#13AECE] dark:bg-[#0EA5E9]"
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
                      <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{post.author.avatar}</span>
                          </div>
                          <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">{post.author.name}</span>
                        </div>
                        <span className="text-xs text-[#0E1F33]/60 dark:text-[#94A3B8]">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedPosts.map((post) => (
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
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{post.author.avatar}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9]">{post.author.name}</p>
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
                <TagIcon className="w-12 h-12 text-[#0E1F33]/40 dark:text-[#94A3B8]" />
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

          {filteredPosts.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0E1F33] dark:bg-[#0A0F1C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated on {tag.name}</h2>
          <p className="text-white/80 dark:text-[#CBD5E1] mb-8 max-w-2xl mx-auto">
            Get the latest {tag.name.toLowerCase()} tutorials, tips, and insights delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 dark:bg-[#1E293B] border border-white/20 dark:border-[#475569]/20 rounded-lg text-white placeholder-white/60 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent"
            />
            <button className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
