"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Share2,
  Bookmark,
  ThumbsUp,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  Check,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"

// Custom syntax highlighter component
const CodeBlock = ({ children, className }: { children: string; className?: string }) => {
  const language = className?.replace("language-", "") || "text"

  return (
    <div className="relative my-6">
      <div className="flex items-center justify-between bg-[#1e293b] dark:bg-[#0f172a] px-4 py-2 rounded-t-lg">
        <span className="text-[#94a3b8] text-sm font-medium">{language}</span>
        <button
          onClick={() => navigator.clipboard.writeText(children)}
          className="text-[#94a3b8] hover:text-white text-sm px-2 py-1 rounded hover:bg-[#334155] transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="bg-[#0f172a] dark:bg-[#020617] text-[#e2e8f0] p-4 rounded-b-lg overflow-x-auto">
        <code className="text-sm leading-relaxed">{children}</code>
      </pre>
    </div>
  )
}

// Mock blog post data
const blogPost = {
  id: 1,
  title: "Building Scalable REST APIs with Python and FastAPI",
  excerpt:
    "Learn how to create production-ready REST APIs using FastAPI, including authentication, database integration, and deployment strategies.",
  content: `
# Building Scalable REST APIs with Python and FastAPI

FastAPI has revolutionized the way we build APIs in Python. With its automatic documentation generation, type hints support, and incredible performance, it's become the go-to choice for modern Python web development.

## Why FastAPI?

FastAPI offers several advantages over traditional frameworks:

- **Performance**: One of the fastest Python frameworks available
- **Type Safety**: Built-in support for Python type hints
- **Automatic Documentation**: Interactive API docs with Swagger UI
- **Modern Python**: Async/await support out of the box

## Setting Up Your First FastAPI Application

Let's start with a basic FastAPI application:

\`\`\`python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.post("/items/")
def create_item(item: Item):
    return item
\`\`\`

## Database Integration

For production applications, you'll need database integration. Here's how to set up SQLAlchemy with FastAPI:

\`\`\`python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
\`\`\`

## Authentication and Security

Security is crucial for any API. FastAPI makes it easy to implement JWT authentication:

\`\`\`python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
\`\`\`

## Testing Your API

Testing is essential for maintaining code quality:

\`\`\`python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}
\`\`\`

## Deployment Strategies

When deploying FastAPI applications, consider these options:

1. **Docker**: Containerize your application for consistent deployments
2. **Uvicorn**: ASGI server for production
3. **Nginx**: Reverse proxy for load balancing
4. **Cloud Platforms**: AWS, GCP, or Azure for scalability

## Performance Optimization

To maximize performance:

- Use async/await for I/O operations
- Implement proper caching strategies
- Optimize database queries
- Use connection pooling
- Monitor with tools like Prometheus

## Conclusion

FastAPI provides an excellent foundation for building modern, scalable APIs. Its combination of performance, developer experience, and automatic documentation makes it an ideal choice for backend development.

The key to success with FastAPI is understanding its async nature and leveraging its type system effectively. Start with simple endpoints and gradually add complexity as your application grows.
  `,
  author: {
    name: "Sarah Ahmed",
    avatar: "SA",
    bio: "Senior Backend Engineer at Google with 8+ years of experience building scalable systems. Passionate about Python, distributed systems, and mentoring developers.",
    social: {
      twitter: "@sarahdev",
      linkedin: "sarah-ahmed-dev",
      github: "sarahdev",
    },
  },
  category: "Python",
  tags: ["FastAPI", "REST API", "Python", "Backend", "Authentication", "Database"],
  publishedAt: "2024-01-15",
  updatedAt: "2024-01-16",
  readTime: "8 min read",
  featured: true,
  image: "/placeholder.svg?height=400&width=800",
  likes: 142,
  comments: 23,
  bookmarks: 67,
}

// Related posts
const relatedPosts = [
  {
    id: 2,
    title: "Advanced FastAPI: Dependency Injection and Middleware",
    excerpt: "Deep dive into FastAPI's dependency injection system and custom middleware creation.",
    category: "Python",
    readTime: "10 min read",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 3,
    title: "Testing FastAPI Applications: Best Practices",
    excerpt: "Comprehensive guide to testing FastAPI applications with pytest and test clients.",
    category: "Python",
    readTime: "12 min read",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 4,
    title: "Deploying FastAPI to Production with Docker",
    excerpt: "Step-by-step guide to containerizing and deploying FastAPI applications.",
    category: "DevOps",
    readTime: "15 min read",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function BlogPostPage({ params }: { params: { id: string } }) {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = blogPost.title

    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`)
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        break
      case "copy":
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        break
    }
    setShowShareMenu(false)
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
        <div className="max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog</span>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <header className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Category and Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link
              href={`/blog/category/${blogPost.category.toLowerCase()}`}
              className="bg-[#13AECE] dark:bg-[#0EA5E9] text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-[#13AECE]/90 dark:hover:bg-[#0284C7] transition-colors"
            >
              {blogPost.category}
            </Link>
            <div className="flex items-center space-x-4 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blogPost.publishedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{blogPost.readTime}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-6 leading-tight">
            {blogPost.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-[#0E1F33]/70 dark:text-[#94A3B8] mb-8 leading-relaxed">{blogPost.excerpt}</p>

          {/* Author and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <Link
              href={`/blog/author/${blogPost.author.name.toLowerCase().replace(" ", "-")}`}
              className="flex items-center space-x-4 group"
            >
              <div className="w-16 h-16 bg-[#13AECE] dark:bg-[#0EA5E9] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{blogPost.author.avatar}</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors">
                  {blogPost.author.name}
                </p>
                <p className="text-[#0E1F33]/60 dark:text-[#94A3B8]">{blogPost.author.bio}</p>
              </div>
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? "bg-[#13AECE] dark:bg-[#0EA5E9] text-white"
                    : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{blogPost.likes + (isLiked ? 1 : 0)}</span>
              </button>

              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? "bg-[#13AECE] dark:bg-[#0EA5E9] text-white"
                    : "bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{blogPost.bookmarks + (isBookmarked ? 1 : 0)}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] rounded-lg hover:bg-[#97C3CC]/20 dark:hover:bg-[#475569]/30 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1E293B] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg shadow-lg p-2 z-10">
                    <button
                      onClick={() => handleShare("twitter")}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-[#97C3CC]/10 dark:hover:bg-[#475569]/20 rounded-lg transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-[#97C3CC]/10 dark:hover:bg-[#475569]/20 rounded-lg transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleShare("facebook")}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-[#97C3CC]/10 dark:hover:bg-[#475569]/20 rounded-lg transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-[#97C3CC]/10 dark:hover:bg-[#475569]/20 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 rounded-2xl overflow-hidden mb-8">
            <img
              src={blogPost.image || "/placeholder.svg"}
              alt={blogPost.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none prose-headings:text-[#0E1F33] dark:prose-headings:text-[#F1F5F9] prose-p:text-[#0E1F33]/80 dark:prose-p:text-[#CBD5E1] prose-a:text-[#13AECE] dark:prose-a:text-[#0EA5E9]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const content = String(children).replace(/\n$/, "")

                  if (!inline && className) {
                    return <CodeBlock className={className}>{content}</CodeBlock>
                  }

                  return (
                    <code
                      className="bg-[#97C3CC]/10 dark:bg-[#475569]/20 px-1.5 py-0.5 rounded text-[#13AECE] dark:text-[#0EA5E9] text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
                p: ({ node, ...props }) => <p className="my-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-4" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-[#13AECE] dark:border-[#0EA5E9] pl-4 italic my-4 text-[#0E1F33]/70 dark:text-[#94A3B8]"
                    {...props}
                  />
                ),
              }}
            >
              {blogPost.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-[#97C3CC]/20 dark:border-[#475569]/20">
            <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blogPost.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag.toLowerCase()}`}
                  className="flex items-center space-x-1 bg-[#97C3CC]/10 dark:bg-[#475569]/20 text-[#0E1F33] dark:text-[#F1F5F9] px-3 py-2 rounded-lg hover:bg-[#13AECE] dark:hover:bg-[#0EA5E9] hover:text-white transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span>{tag}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Related Posts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#97C3CC]/5 dark:bg-[#1E293B]/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {relatedPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="group">
                <article className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="aspect-video bg-gradient-to-br from-[#13AECE]/10 to-[#97C3CC]/20 dark:from-[#0EA5E9]/20 dark:to-[#475569]/30 relative overflow-hidden">
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-[#13AECE] dark:text-[#0EA5E9] text-sm font-medium">{post.category}</span>
                      <div className="flex items-center space-x-2 text-[#0E1F33]/60 dark:text-[#94A3B8] text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2 group-hover:text-[#13AECE] dark:group-hover:text-[#0EA5E9] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] text-sm line-clamp-2">{post.excerpt}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0E1F33] dark:bg-[#0A0F1C]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Enjoyed this article?</h2>
          <p className="text-white/80 dark:text-[#CBD5E1] mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for more backend engineering insights and tutorials.
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
