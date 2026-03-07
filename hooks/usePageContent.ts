import { useEffect, useState } from 'react';
import { PageContent } from '../types';
import { api, ApiError } from '../services/api';

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
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const row = await api.getPageContentBySlug(slug, { signal: controller.signal });
        if (controller.signal.aborted) return;

        setHasRemote(true);
        setPageContent(row || fallback);
        setIsActive(row?.isActive ?? fallback.isActive);
      } catch (error) {
        if (error instanceof ApiError && error.isAbortError) {
          return;
        }
        if (controller.signal.aborted) return;

        setHasRemote(false);
        setPageContent(fallback);
        setIsActive(fallback.isActive);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [slug, fallback]);

  return { pageContent, loading, isActive, hasRemote };
}
