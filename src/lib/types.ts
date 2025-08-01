
export type Article = {
  id: string;
  title: string;
  rewrittenTitle: string;
  source: string;
  imageUrl: string;
  url: string;
  content: string;
  keywords: string[];
  publishedAt: string;
  type: 'news' | 'blog';
};
