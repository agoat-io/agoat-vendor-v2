/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Create SEO-friendly URL for a post
 */
export function createPostUrl(post: { id: string; slug: string; title: string }): string {
  // Use slug if available, otherwise generate from title
  const slug = post.slug || generateSlug(post.title)
  return `/post/${post.id}/${slug}`
}

/**
 * Extract post ID from SEO-friendly URL
 */
export function extractPostIdFromUrl(path: string): string | null {
  const match = path.match(/^\/post\/([^\/]+)/)
  return match ? match[1] : null
}
