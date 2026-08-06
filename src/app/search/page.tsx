import type { Metadata } from "next";
import { Suspense } from "react";
import { AdvancedSearchPage } from "@/features/search/components/advanced-search-page";

export const metadata: Metadata = {
  title: "Tìm kiếm nâng cao | TaleX",
  description:
    "Tìm kiếm phim, truyện tranh, thể loại và tag trên TaleX với bộ lọc nâng cao.",
};

export default function SearchPage() {
  return (
    <Suspense>
      <AdvancedSearchPage />
    </Suspense>
  );
}
