import React from 'react';

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    const parts = selector.match(/\[([^\]]+)="([^"]+)"\]/);
    if (parts) {
      el.setAttribute(parts[1], parts[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(selector: string, attrName: string, value: string) {
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    const parts = selector.match(/\[([^\]]+)="([^"]+)"\]/);
    if (parts) {
      el.setAttribute(parts[1], parts[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attrName, value);
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  ogImage = 'https://zeroconfigide.netlify.app/og-image.png',
  ogType = 'website',
}: SeoProps) {
  React.useEffect(() => {
    // Title
    document.title = title;

    // Basic meta tags
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
    }
    if (keywords) {
      setMeta('meta[name="keywords"]', 'content', keywords);
    }

    // Canonical link
    const url = canonical || window.location.href;
    setLink('link[rel="canonical"]', 'href', url);

    // Open Graph tags (important for Google's rich snippets)
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:url"]', 'content', url);
    if (description) {
      setMeta('meta[property="og:description"]', 'content', description);
    }
    setMeta('meta[property="og:image"]', 'content', ogImage);

    // Twitter card tags
    setMeta('meta[property="twitter:title"]', 'content', title);
    setMeta('meta[property="twitter:url"]', 'content', url);
    if (description) {
      setMeta('meta[property="twitter:description"]', 'content', description);
    }
    setMeta('meta[property="twitter:image"]', 'content', ogImage);
  }, [title, description, keywords, canonical, ogImage, ogType]);

  return null;
}
