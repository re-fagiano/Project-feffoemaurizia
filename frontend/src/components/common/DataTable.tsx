import { ReactNode, useState, useMemo } from "react";
import { Search } from "lucide-react";

export interface Column<T> {
    header: string;
    accessor?: keyof T | ((item: T) => ReactNode);
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    searchable?: boolean;
    searchKeys?: (keyof T)[];
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    loading = false,
    emptyMessage = "Nessun dato trovato.",
    onRowClick,
    searchable = false,
    searchKeys = []
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        if (!searchable || !searchTerm || searchKeys.length === 0) return data;

        return data.filter(item => {
            return searchKeys.some(key => {
                const value = item[key];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [data, searchTerm, searchable, searchKeys]);

    return (
        <div className="table-container">
            {searchable && (
                <div className="p-4 border-b border-gray-800">
                    <div className="relative max-w-sm">
                        <input
                            type="text"
                            placeholder="Cerca..."
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            )}
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={col.headerClassName || ""}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                            </td>
                        </tr>
                    ) : filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={onRowClick ? "cursor-pointer hover:bg-gray-800/50" : ""}
                            >
                                {columns.map((col, index) => (
                                    <td key={index} className={col.className || ""}>
                                        {typeof col.accessor === "function"
                                            ? col.accessor(item)
                                            : col.accessor
                                                ? (item[col.accessor] as ReactNode)
                                                : null}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
