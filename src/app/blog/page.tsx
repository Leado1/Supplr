import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, Calendar, User, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";

export default function BlogPage() {

  const blogPosts = [
    {
      id: 1,
      title: "The Hidden Cost of Expired Medical Supplies: $47k Average Loss Per Practice",
      excerpt: "New industry research reveals shocking waste statistics from expired Botox, fillers, and medical supplies. Learn how practices are fighting back.",
      category: "Industry Research",
      readTime: "5 min read",
      date: "Jan 8, 2026",
      author: "Dr. Sarah Chen",
      featured: true,
      tags: ["Waste Reduction", "Cost Savings", "Research"]
    },
    {
      id: 2,
      title: "Temperature Monitoring: Protecting $50k+ of Cold-Storage Medical Products",
      excerpt: "How temperature excursions destroy expensive Botox and vaccines, and the technology preventing these costly mistakes.",
      category: "Best Practices",
      readTime: "7 min read",
      date: "Jan 5, 2026",
      author: "Maria Rodriguez",
      featured: false,
      tags: ["Temperature Control", "Storage", "Technology"]
    },
    {
      id: 3,
      title: "FDA Lot Tracking Made Simple: Compliance Without the Complexity",
      excerpt: "Navigate FDA regulations for medical devices and injectables with automated lot tracking and recall reporting.",
      category: "Compliance",
      readTime: "4 min read",
      date: "Jan 3, 2026",
      author: "James Thompson",
      featured: false,
      tags: ["FDA Compliance", "Lot Tracking", "Regulations"]
    },
    {
      id: 4,
      title: "5 Signs Your Medical Practice Needs Better Inventory Management",
      excerpt: "From expired Juvederm to emergency supply runs, recognize the warning signs that you're losing money on inventory.",
      category: "Practice Management",
      readTime: "6 min read",
      date: "Dec 30, 2025",
      author: "Dr. Michael Kim",
      featured: false,
      tags: ["Inventory Management", "Warning Signs", "Efficiency"]
    },
    {
      id: 5,
      title: "ROI Calculator: How Much Money Is Your Practice Losing to Expired Supplies?",
      excerpt: "Use our free calculator to estimate your annual losses from expired medical supplies and see potential savings.",
      category: "Tools",
      readTime: "3 min read",
      date: "Dec 28, 2025",
      author: "Supplr Team",
      featured: false,
      tags: ["ROI", "Calculator", "Savings"]
    },
    {
      id: 6,
      title: "Multi-Location Medical Practices: Centralizing Inventory Without Chaos",
      excerpt: "Best practices for managing inventory across multiple clinic locations, from bulk purchasing to transfer tracking.",
      category: "Multi-Location",
      readTime: "8 min read",
      date: "Dec 25, 2025",
      author: "Lisa Park",
      featured: false,
      tags: ["Multi-Location", "Scaling", "Operations"]
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Neue Haas Grotesk, sans-serif' }}>
                Supplr
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Product
              </Link>
              <Link href="/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm font-medium text-foreground">
                Blog
              </Link>
              <div className="relative group">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1">
                  <span>Resources</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </nav>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Medical Inventory
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent"> Insights</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Expert guidance, industry insights, and best practices for medical practice inventory management.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="px-3 py-1">Industry Research</Badge>
              <Badge variant="outline" className="px-3 py-1">Best Practices</Badge>
              <Badge variant="outline" className="px-3 py-1">Compliance</Badge>
              <Badge variant="outline" className="px-3 py-1">Cost Savings</Badge>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        <section className="pb-12">
          <div className="container mx-auto max-w-6xl px-4">
            {blogPosts.filter(post => post.featured).map(post => (
              <Card key={post.id} className="relative overflow-hidden border-2 border-primary/20 shadow-xl">
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                </div>
                <CardHeader className="pt-16 pb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {post.date}
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>
                  <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">By {post.author}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                    Read Full Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Article Grid */}
        <section className="pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Latest Articles</h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.filter(post => !post.featured).map(post => (
                <Card key={post.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <Badge variant="secondary">{post.category}</Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{post.excerpt}</p>

                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{post.date}</span>
                      </div>
                      <Button variant="outline" size="sm">Read More</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="bg-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Stay Ahead of Industry Trends</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get weekly insights on medical inventory management, compliance updates, and cost-saving strategies delivered to your inbox.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button className="bg-gradient-to-r from-primary to-primary/80 px-6 py-3">
                  Subscribe
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Join 2,500+ medical professionals. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Browse by Topic</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cost Savings</h3>
                <p className="text-muted-foreground text-sm mb-4">Strategies to reduce waste and maximize ROI</p>
                <Badge variant="secondary">12 articles</Badge>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Compliance</h3>
                <p className="text-muted-foreground text-sm mb-4">FDA regulations and HIPAA requirements</p>
                <Badge variant="secondary">8 articles</Badge>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-all duration-300">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Best Practices</h3>
                <p className="text-muted-foreground text-sm mb-4">Expert tips and proven strategies</p>
                <Badge variant="secondary">15 articles</Badge>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Supplr. Built for medical practices that care about efficiency.</p>
        </div>
      </footer>
    </div>
  );
}