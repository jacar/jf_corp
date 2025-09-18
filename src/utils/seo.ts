export const setMetaTag = (name: string, content: string) => {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const setOGTag = (property: string, content: string) => {
  if (!content) return;
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const applySEO = (options: {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  image?: string;
}) => {
  const {
    title,
    description,
    keywords,
    canonicalPath,
    image,
  } = options;

  if (title) {
    document.title = title;
    setOGTag('og:title', title);
    setMetaTag('twitter:title', title);
  }
  if (description) {
    setMetaTag('description', description);
    setOGTag('og:description', description);
    setMetaTag('twitter:description', description);
  }
  if (keywords) {
    setMetaTag('keywords', keywords);
  }
  if (canonicalPath) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalPath);
    setOGTag('og:url', canonicalPath);
  }
  if (image) {
    setOGTag('og:image', image);
    setMetaTag('twitter:image', image);
  }
};




