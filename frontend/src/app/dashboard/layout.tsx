"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function LegacyDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen flex bg-gray-950 text-white">
                <Sidebar user={null} />
                <div className="flex-1 flex flex-col min-w-0">
                    <Topbar />
                    <main className="flex-1 overflow-auto bg-gray-950">{children}</main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
