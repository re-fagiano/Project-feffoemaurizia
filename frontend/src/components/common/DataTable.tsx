import { ReactNode } from "react";

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
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    loading = false,
    emptyMessage = "Nessun dato trovato.",
    onRowClick,
}: DataTableProps<T>) {
    return (
        <div className="table-container">
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
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
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
