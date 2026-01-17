import { useCallback, useEffect, useRef, useState } from "react";

import type { DiffRowOrCollapsed, SearchState } from "../types";

import { SEARCH_DEBOUNCE_MS } from "../utils/constants";
import { highlightMatches, performSearch } from "../utils/diffSearchUtils";

export function useSearch(
  leftView: DiffRowOrCollapsed[],
  initialTerm?: string,
  onSearchMatch?: (index: number) => void,
  viewerRef?: React.RefObject<HTMLDivElement | null>,
  listContainerRef?: React.RefObject<HTMLDivElement | null>,
) {
  const [searchState, setSearchState] = useState<SearchState>({
    term: initialTerm ?? "",
    results: [],
    currentIndex: 0,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  const handleSearch = useCallback((term: string) => {
    setSearchState(prev => ({ ...prev, term }));

    if (searchTimeoutRef.current)
      clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const results = performSearch(term, leftView);
      setSearchState(prev => ({ ...prev, results, currentIndex: 0 }));
    }, SEARCH_DEBOUNCE_MS);
  }, [leftView]);

  const navigateMatch = useCallback((direction: "next" | "prev") => {
    if (searchState.results.length === 0)
      return;

    const newIndex = direction === "next"
      ? (searchState.currentIndex + 1) % searchState.results.length
      : (searchState.currentIndex - 1 + searchState.results.length) % searchState.results.length;

    setSearchState(prev => ({ ...prev, currentIndex: newIndex }));

    const matchIndex = searchState.results[newIndex];
    if (onSearchMatch)
      onSearchMatch(matchIndex);

    return matchIndex;
  }, [searchState, onSearchMatch]);

  useEffect(() => {
    if (!viewerRef?.current)
      return;

    highlightMatches(searchState.term, viewerRef.current);

    const observer = new MutationObserver(() => viewerRef.current && highlightMatches(searchState.term, viewerRef.current));
    const config = { childList: true, subtree: true };
    observer.observe(viewerRef.current, config);

    const listContainer = listContainerRef?.current;
    if (listContainer) {
      const handleScroll = () => setTimeout(() => viewerRef.current && highlightMatches(searchState.term, viewerRef.current), 100);
      listContainer.addEventListener("scroll", handleScroll);
      return () => {
        observer.disconnect();
        listContainer.removeEventListener("scroll", handleScroll);
      };
    }

    return () => observer.disconnect();
  }, [searchState.term, viewerRef, listContainerRef]);

  useEffect(() => {
    if (initialTerm !== undefined) {
      handleSearch(initialTerm);
    }
  }, [initialTerm, handleSearch]);

  return { searchState, handleSearch, navigateMatch };
}
