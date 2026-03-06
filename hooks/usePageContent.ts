import { useEffect, useState } from 'react';
import { PageContent } from '../types';
import { api } from '../services/api';

interface UsePageContentResult {
  pageContent: PageContent;
  loading: boolean;
  isActive: boolean;
  hasRemote: boolean;
}

export function usePageContent(slug: string, fallback: PageContent): UsePageContentResult {
  const [pageContent, setPageContent] = useState<PageContent>(fallback);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(fallback.isActive);
  const [hasRemote, setHasRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const row = await api.getPageContentBySlug(slug);
        if (!cancelled) {
          setHasRemote(true);
          setPageContent(row || fallback);
          setIsActive(row?.isActive ?? fallback.isActive);
        }
      } catch {
        if (!cancelled) {
          setHasRemote(false);
          setPageContent(fallback);
          setIsActive(fallback.isActive);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, fallback]);

  return { pageContent, loading, isActive, hasRemote };
}
