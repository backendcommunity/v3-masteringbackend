"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Pagination } from "@/components/pagination";

// Mock blog data
const blogPosts = [
  {
    id: 1,
    title: "Building Scalable REST APIs with Python and FastAPI",
    excerpt:
      "Learn how to create production-ready REST APIs using FastAPI, including authentication, database integration, and deployment strategies.",
    content: "Full content here...",
    author: {
      name: "Sarah Ahmed",
      avatar: "SA",
      bio: "Senior Backend Engineer at Google",
    },
    category: "Python",
    tags: ["FastAPI", "REST API", "Python", "Backend"],
    publishedAt: "2024-01-15",
    readTime: "8 min read",
    featured: true,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 2,
    title: "Microservices Architecture: A Complete Guide",
    excerpt:
      "Dive deep into microservices patterns, communication strategies, and best practices for building distributed systems.",
    content: "Full content here...",
    author: {
      name: "Michael Johnson",
      avatar: "MJ",
      bio: "Senior Developer at Netflix",
    },
    category: "Architecture",
    tags: ["Microservices", "Architecture", "Distributed Systems", "Docker"],
    publishedAt: "2024-01-12",
    readTime: "12 min read",
    featured: true,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 3,
    title: "Database Design Patterns for High Performance",
    excerpt:
      "Explore advanced database design patterns, indexing strategies, and optimization techniques for high-traffic applications.",
    content: "Full content here...",
    author: {
      name: "Emily Park",
      avatar: "EP",
      bio: "Backend Lead at Stripe",
    },
    category: "Database",
    tags: ["Database", "Performance", "SQL", "Optimization"],
    publishedAt: "2024-01-10",
    readTime: "10 min read",
    featured: false,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 4,
    title: "Node.js Performance Optimization Techniques",
    excerpt:
      "Master advanced Node.js optimization techniques including clustering, caching, and memory management.",
    content: "Full content here...",
    author: {
      name: "David Liu",
      avatar: "DL",
      bio: "Staff Engineer at Airbnb",
    },
    category: "JavaScript",
    tags: ["Node.js", "Performance", "JavaScript", "Optimization"],
    publishedAt: "2024-01-08",
    readTime: "15 min read",
    featured: false,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 5,
    title: "Implementing JWT Authentication in Spring Boot",
    excerpt:
      "Step-by-step guide to implementing secure JWT authentication in Spring Boot applications with best practices.",
    content: "Full content here...",
    author: {
      name: "Alex Kim",
      avatar: "AK",
      bio: "Senior Engineer at Amazon",
    },
    category: "Java",
    tags: ["Spring Boot", "JWT", "Authentication", "Security"],
    publishedAt: "2024-01-05",
    readTime: "7 min read",
    featured: false,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 6,
    title: "GraphQL vs REST: When to Use Which",
    excerpt:
      "A comprehensive comparison of GraphQL and REST APIs, including use cases, performance considerations, and implementation examples.",
    content: "Full content here...",
    author: {
      name: "Rachel Martinez",
      avatar: "RM",
      bio: "API Architect at Microsoft",
    },
    category: "API Design",
    tags: ["GraphQL", "REST", "API Design", "Backend"],
    publishedAt: "2024-01-03",
    readTime: "9 min read",
    featured: false,
    image: "/placeholder.svg?height=400&width=600",
  },
];

const categories = [
  "All",
  "Python",
  "JavaScript",
  "Java",
  "Architecture",
  "Database",
  "API Design",
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  // Pagination for regular posts
  const totalPages = Math.ceil(regularPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = regularPosts.slice(
    startIndex,
    startIndex + postsPerPage
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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
                className="text-[#13aece]/70 hover:text-[#13aece] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-[#13AECE] dark:text-[#13aece] font-medium"
              >
                Blog
              </Link>
              <Link
                href="/courses"
                className="text-[#13aece]/70 hover:text-[#13aece] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors"
              >
                Courses
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#97C3CC]/10 via-[#E8F4F8]/50 to-white dark:from-[#1E293B]/30 dark:via-[#0F172A]/50 dark:to-[#0A0F1C]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#13aece] dark:text-[#F1F5F9] mb-6">
            Backend Engineering
            <span className="block text-[#13AECE] dark:text-[#13aece]">
              Blog
            </span>
          </h1>
          <p className="text-xl text-[#13aece]/70 dark:text-[#94A3B8] max-w-3xl mx-auto mb-8">
            Deep dives into backend development, system design, and engineering
            best practices from industry experts.
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#13aece]/40 dark:text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-xl text-[#13aece] dark:text-[#F1F5F9] placeholder-[#13aece]/40 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#13aece] focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#13AECE] dark:bg-[#13aece] text-white"
                      : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#13aece] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-[#13AECE] dark:bg-[#13aece] text-white"
                      : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#13aece] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#13aece] dark:text-[#F1F5F9] rounded-lg hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Category Filters */}
            {showFilters && (
              <div className="glass-card p-4 rounded-xl mb-6">
                <h3 className="text-lg font-semibold text-[#13aece] dark:text-[#F1F5F9] mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-[#13AECE] dark:bg-[#13aece] text-white"
                          : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#13aece] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-[#13aece] dark:text-[#F1F5F9] mb-8">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <article className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#13aece]/20 dark:to-[#475569]/30 relative overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#13AECE] dark:bg-[#13aece] text-white px-3 py-1 rounded-full text-sm font-medium">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-[#13AECE] dark:text-[#13aece] text-sm font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center space-x-2 text-[#13aece]/60 dark:text-[#94A3B8] text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[#13aece]/60 dark:text-[#94A3B8] text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#13aece] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#13aece] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[#13aece]/70 dark:text-[#94A3B8] mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#13AECE] dark:bg-[#13aece] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {post.author.avatar}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#13aece] dark:text-[#F1F5F9]">
                              {post.author.name}
                            </p>
                            <p className="text-xs text-[#13aece]/60 dark:text-[#94A3B8]">
                              {post.author.bio}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#13AECE] dark:text-[#13aece] group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#13aece] dark:text-[#F1F5F9]">
              Latest Articles
            </h2>
            <div className="text-[#13aece]/60 dark:text-[#94A3B8]">
              {filteredPosts.length} article
              {filteredPosts.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <article className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#13aece]/20 dark:to-[#475569]/30 relative overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-[#13AECE] dark:text-[#13aece] text-sm font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center space-x-2 text-[#13aece]/60 dark:text-[#94A3B8] text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-[#13aece] dark:text-[#F1F5F9] mb-2 group-hover:text-[#13AECE] dark:group-hover:text-[#13aece] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-[#13aece]/70 dark:text-[#94A3B8] text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#13AECE] dark:bg-[#13aece] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {post.author.avatar}
                            </span>
                          </div>
                          <span className="text-sm text-[#13aece] dark:text-[#F1F5F9]">
                            {post.author.name}
                          </span>
                        </div>
                        <span className="text-xs text-[#13aece]/60 dark:text-[#94A3B8]">
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
                <Link key={post.id} href={`/blog/${post.id}`} className="group">
                  <article className="glass-card p-6 rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#13aece]/20 dark:to-[#475569]/30 rounded-lg overflow-hidden">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                      <div className="md:w-2/3">
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-[#13AECE] dark:text-[#13aece] text-sm font-medium">
                            {post.category}
                          </span>
                          <div className="flex items-center space-x-2 text-[#13aece]/60 dark:text-[#94A3B8] text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[#13aece]/60 dark:text-[#94A3B8] text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-[#13aece] dark:text-[#F1F5F9] mb-3 group-hover:text-[#13AECE] dark:group-hover:text-[#13aece] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-[#13aece]/70 dark:text-[#94A3B8] mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#13AECE] dark:bg-[#13aece] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {post.author.avatar}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#13aece] dark:text-[#F1F5F9]">
                                {post.author.name}
                              </p>
                              <p className="text-xs text-[#13aece]/60 dark:text-[#94A3B8]">
                                {post.author.bio}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#13aece] dark:text-[#F1F5F9] px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-[#13aece]/40 dark:text-[#94A3B8]" />
              </div>
              <h3 className="text-xl font-bold text-[#13aece] dark:text-[#F1F5F9] mb-2">
                No articles found
              </h3>
              <p className="text-[#13aece]/60 dark:text-[#94A3B8] mb-6">
                Try adjusting your search terms or filters to find what you're
                looking for.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="bg-[#13AECE] dark:bg-[#13aece] text-white px-6 py-3 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#13aece] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#13aece] dark:bg-[#0A0F1C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-white/80 dark:text-[#CBD5E1] mb-8 max-w-2xl mx-auto">
            Get the latest backend engineering articles, tutorials, and insights
            delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 dark:bg-[#1E293B] border border-white/20 dark:border-[#475569]/20 rounded-lg text-white placeholder-white/60 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#13aece] focus:border-transparent"
            />
            <button className="bg-[#13AECE] dark:bg-[#13aece] text-white px-6 py-3 rounded-lg hover:bg-[#13AECE]/90 dark:hover:bg-[#13aece] transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-white/60 dark:text-[#94A3B8] text-sm mt-4">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
