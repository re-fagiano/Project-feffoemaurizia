import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export default function PageHeader({ title, description, children, actionLabel, onAction }: PageHeaderProps) {
    return (
        <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && <p className="text-gray-400">{description}</p>}
            </div>
            <div className="flex gap-2">
                {children}
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="btn btn-primary"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </header>
    );
}
