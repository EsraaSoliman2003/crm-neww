import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getQueryStateKey,
  parseQueryState,
  writeQueryState,
} from "@/utils/navigationState";

type Option = {
  value: string;
  label: string;
};

export function useCategoryFilter<T>(
  data: T[],
  searchKey: keyof T,
  categoryKey: keyof T,
  subCategoryKey: keyof T,
) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const queryStateKey = getQueryStateKey("categoryFilters");
  const serializedFilterState = searchParams.get(queryStateKey);
  const skipFilterSaveRef = useRef(true);
  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<Option>({
    value: "",
    label: "",
  });

  const [selectedSubCategory, setSelectedSubCategory] = useState<Option>({
    value: "",
    label: "",
  });
  const currentFilterStateRef = useRef({
    search,
    selectedCategory,
    selectedSubCategory,
  });
  useLayoutEffect(() => {
    currentFilterStateRef.current = {
      search,
      selectedCategory,
      selectedSubCategory,
    };
  }, [search, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    skipFilterSaveRef.current = true;

    const savedState = parseQueryState<{
      search?: string;
      selectedCategory?: Option;
      selectedSubCategory?: Option;
    }>(serializedFilterState);

    if (!savedState) return;

    const restoredState = {
      search: savedState.search ?? "",
      selectedCategory:
        savedState.selectedCategory ?? { value: "", label: "" },
      selectedSubCategory:
        savedState.selectedSubCategory ?? { value: "", label: "" },
    };
    if (
      JSON.stringify(currentFilterStateRef.current) ===
      JSON.stringify(restoredState)
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setSearch(restoredState.search);
      setSelectedCategory(restoredState.selectedCategory);
      setSelectedSubCategory(restoredState.selectedSubCategory);
    });
    return () => cancelAnimationFrame(frame);
  }, [serializedFilterState]);

  useEffect(() => {
    if (skipFilterSaveRef.current) {
      skipFilterSaveRef.current = false;
      return;
    }

    const hasFilters =
      search.length > 0 ||
      selectedCategory.value.length > 0 ||
      selectedSubCategory.value.length > 0;

    writeQueryState(
      queryStateKey,
      hasFilters
        ? { search, selectedCategory, selectedSubCategory }
        : null,
    );
  }, [
    pathname,
    queryStateKey,
    search,
    selectedCategory,
    selectedSubCategory,
  ]);

  const filteredData = useMemo(() => {
    return data.filter((item: T) => {
      const matchSearch = String(item[searchKey] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        selectedCategory.value === "" ||
        item[categoryKey] === selectedCategory.label;

      const matchSubCategory =
        selectedSubCategory.value === "" ||
        item[subCategoryKey] === selectedSubCategory.label;

      return matchSearch && matchCategory && matchSubCategory;
    });
  }, [
    data,
    search,
    selectedCategory,
    selectedSubCategory,
    searchKey,
    categoryKey,
    subCategoryKey,
  ]);

  return {
    search,
    setSearch,

    selectedCategory,
    setSelectedCategory,

    selectedSubCategory,
    setSelectedSubCategory,

    filteredData,
  };
}
