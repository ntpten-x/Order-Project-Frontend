import type { CreatedSort } from "../components/ui/pagination/ListPagination";

export const DEFAULT_CREATED_SORT: CreatedSort = "old";

export function parseCreatedSort(value: string | null | undefined): CreatedSort {
    if (!value) return DEFAULT_CREATED_SORT;
    return value === "new" ? "new" : DEFAULT_CREATED_SORT;
}
