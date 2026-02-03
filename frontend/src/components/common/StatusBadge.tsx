interface StatusBadgeProps {
    status: boolean | "active" | "inactive" | "pending" | "warning" | "danger" | "success" | "info" | "default";
    label?: string;
    trueLabel?: string;
    falseLabel?: string;
}

export default function StatusBadge({ status, label, trueLabel = "Attivo", falseLabel = "Inattivo" }: StatusBadgeProps) {
    if (typeof status === "boolean") {
        return (
            <span className={`badge ${status ? "badge-success" : "badge-danger"}`}>
                {label || (status ? trueLabel : falseLabel)}
            </span>
        );
    }

    const badgeClass = {
        active: "badge-success",
        success: "badge-success",
        inactive: "badge-danger",
        danger: "badge-danger",
        pending: "badge-warning",
        warning: "badge-warning",
        info: "badge-info",
        default: "badge-default",
    }[status];

    return (
        <span className={`badge ${badgeClass}`}>
            {label || status}
        </span>
    );
}
