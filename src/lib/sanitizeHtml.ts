import DOMPurify from 'dompurify'

/**
 * Allowlist matching what the rich-text editor produces (plus the common tags a
 * paste from another page might bring). Everything else — <script>, <style>,
 * event handlers like onerror, javascript: URLs, inline styles — is stripped.
 * This is the single place description HTML is cleaned before it's stored,
 * previewed, or exported into the WooCommerce CSV.
 */
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'a', 'p', 'br', 'h2', 'h3', 'ul', 'ol', 'li']
const ALLOWED_ATTR = ['href', 'target', 'rel']

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR })
}
