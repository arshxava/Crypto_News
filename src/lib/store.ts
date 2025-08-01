
import { create } from 'zustand';
import type { Article } from './types';

interface ArticleState {
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  getArticleById: (id: string) => Article | undefined;
  clearArticles: () => void;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  setArticles: (articles) => set({ articles }),
  getArticleById: (id) => {
    const decodedId = decodeURIComponent(id);
    return get().articles.find((article) => article.id === decodedId);
  },
  clearArticles: () => set({ articles: [] }),
}));
