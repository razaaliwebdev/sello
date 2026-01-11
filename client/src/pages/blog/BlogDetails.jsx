import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetBlogByIdQuery,
  useGetBlogsQuery,
} from "../../redux/services/api";
import { formatDate } from "../../utils/format";
import BlogsHeroSection from "../../components/sections/blogs/BlogsHeroSection";
import SEO from "../../components/common/SEO";
import Spinner from "../../components/Spinner";
import { buildBlogUrl } from "../../utils/urlBuilders";
import BlogCommentsSection from "../../components/sections/blogs/BlogCommentsSection";

const BlogDetails = () => {
  const { id } = useParams();
  const { data: blog, isLoading, error, isError } = useGetBlogByIdQuery(id);

  // Get related blogs (same category, excluding current blog)
  const { data: relatedBlogsData } = useGetBlogsQuery(
    {
      limit: 3,
      status: "published",
      category: blog?.category?._id,
      ...(blog?._id && { exclude: blog._id }),
    },
    {
      skip: !blog?.category?._id,
    }
  );

  const relatedBlogs =
    relatedBlogsData?.blogs?.filter((b) => b._id !== blog?._id).slice(0, 3) ||
    [];

  // Redirect to 404 or show error
  useEffect(() => {
    if (isError && error?.status === 404) {
      // Blog not found - could redirect or show error
    }
  }, [isError, error]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div>
        <BlogsHeroSection />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <Spinner fullScreen={false} />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div>
        <BlogsHeroSection />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Blog Post Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or has been
              removed.
            </p>
            <Link
              to="/blog"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Back to All Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO
        title={blog.metaTitle || blog.title}
        description={
          blog.metaDescription ||
          blog.excerpt ||
          blog.content?.replace(/<[^>]*>/g, "").substring(0, 160)
        }
        image={blog.featuredImage}
        url={buildBlogUrl(blog)}
      />
      <BlogsHeroSection />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Blog Header */}
        <div className="mb-8">
          {/* Author and Date Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>
              By{" "}
              <span className="font-semibold text-gray-900">
                {blog.author?.name || "Admin"}
              </span>
            </span>
            <span>|</span>
            <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
          </div>

          {/* Category and Meta Info */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            {blog.category && (
              <>
                <Link
                  to={`/blog?category=${blog.category._id}`}
                  className="text-primary-500 hover:underline font-medium"
                >
                  {blog.category.name}
                </Link>
                <span>·</span>
              </>
            )}
            <span>{blog.readTime || 5} min read</span>
            {blog.views > 0 && (
              <>
                <span>·</span>
                <span>{blog.views} views</span>
              </>
            )}
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight">
            {blog.title}
          </h2>
        </div>

        {/* Blog Content */}
        <div className="blog-content-wrapper mb-8">
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-8 prose-headings:mb-4 prose-h1:text-4xl prose-h1:font-bold prose-h1:mt-10 prose-h1:mb-6 prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base prose-a:text-primary-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-bold prose-img:rounded-lg prose-img:shadow-md prose-img:my-8 prose-img:w-full prose-ul:my-6 prose-ol:my-6 prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
        <style>{`
          .blog-content-wrapper {
            width: 100%;
            position: relative;
            isolation: isolate;
          }
          .blog-content-wrapper .prose {
            color: #374151;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
          .blog-content-wrapper .prose > *:first-child {
            margin-top: 0 !important;
          }
          .blog-content-wrapper .prose > *:last-child {
            margin-bottom: 0 !important;
          }
          .blog-content-wrapper .prose h1,
          .blog-content-wrapper .prose h2,
          .blog-content-wrapper .prose h3,
          .blog-content-wrapper .prose h4,
          .blog-content-wrapper .prose h5,
          .blog-content-wrapper .prose h6 {
            line-height: 1.3 !important;
            font-weight: 700 !important;
            color: #111827 !important;
            clear: both !important;
            display: block !important;
            width: 100% !important;
            position: relative !important;
            z-index: 1;
            page-break-after: avoid;
          }
          .blog-content-wrapper .prose h1 {
            font-size: 2.25rem !important;
            margin-top: 2.5rem !important;
            margin-bottom: 1.5rem !important;
          }
          .blog-content-wrapper .prose h2 {
            font-size: 1.875rem !important;
            margin-top: 2rem !important;
            margin-bottom: 1rem !important;
          }
          .blog-content-wrapper .prose h3 {
            font-size: 1.5rem !important;
            margin-top: 1.5rem !important;
            margin-bottom: 0.75rem !important;
          }
          .blog-content-wrapper .prose h4 {
            font-size: 1.25rem !important;
            margin-top: 1.25rem !important;
            margin-bottom: 0.5rem !important;
          }
          .blog-content-wrapper .prose p {
            margin-top: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            line-height: 1.75 !important;
            font-size: 1rem !important;
            color: #374151 !important;
            display: block !important;
            width: 100% !important;
            position: relative !important;
            z-index: 1;
            clear: both;
          }
          .blog-content-wrapper .prose p:first-of-type {
            margin-top: 0 !important;
          }
          .blog-content-wrapper .prose img {
            margin: 2rem auto !important;
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            clear: both;
          }
          .blog-content-wrapper .prose ul,
          .blog-content-wrapper .prose ol {
            margin-top: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            padding-left: 1.75rem !important;
            clear: both;
          }
          .blog-content-wrapper .prose li {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.75;
          }
          .blog-content-wrapper .prose blockquote {
            border-left: 4px solid #FFA602 !important;
            padding-left: 1.5rem !important;
            margin: 2rem 0 !important;
            font-style: italic;
            color: #4B5563;
            clear: both;
          }
          .blog-content-wrapper .prose a {
            color: #FFA602 !important;
            text-decoration: none !important;
            font-weight: 500;
            transition: text-decoration 0.2s;
          }
          .blog-content-wrapper .prose a:hover {
            text-decoration: underline !important;
          }
          .blog-content-wrapper .prose strong {
            font-weight: 700 !important;
            color: #111827 !important;
          }
          .blog-content-wrapper .prose em {
            font-style: italic !important;
          }
          .blog-content-wrapper .prose u {
            text-decoration: underline !important;
          }
          .blog-content-wrapper .prose code {
            background-color: #F3F4F6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
            font-family: 'Courier New', monospace;
          }
          .blog-content-wrapper .prose pre {
            background-color: #1F2937;
            color: #F9FAFB;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 2rem 0;
            clear: both;
          }
          .blog-content-wrapper .prose pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
          }
          .blog-content-wrapper .prose hr {
            margin: 2rem 0;
            border: none;
            border-top: 1px solid #E5E7EB;
            clear: both;
          }
          /* Ensure no floating elements cause overlap */
          .blog-content-wrapper .prose * {
            box-sizing: border-box;
          }
        `}</style>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related Blogs Section */}
        {relatedBlogs.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog._id}
                  to={`/blog/${relatedBlog.slug || relatedBlog._id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {relatedBlog.featuredImage && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={relatedBlog.featuredImage}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {relatedBlog.title}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDate(
                        relatedBlog.publishedAt || relatedBlog.createdAt
                      )}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedBlog.excerpt ||
                        relatedBlog.content
                          ?.replace(/<[^>]*>/g, "")
                          .substring(0, 100) + "..."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <Link
            to="/blog"
            className="text-primary-500 hover:underline inline-flex items-center gap-2"
          >
            ← Back to all blogs
          </Link>
        </div>

        {/* Comments Section */}
        {blog && <BlogCommentsSection blogId={blog._id} />}
      </div>
    </div>
  );
};

export default BlogDetails;
