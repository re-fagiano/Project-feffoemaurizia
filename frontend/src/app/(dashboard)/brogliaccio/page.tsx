"use client";

import BrogliaccioBoard from "@/components/BrogliaccioBoard";
import { StickyNote as StickyNoteIcon, Plus } from "lucide-react";

export default function BrogliacciPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <StickyNoteIcon className="w-7 h-7 text-amber-600" />
                        Brogliaccio
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestisci le tue note e appunti rapidi
                    </p>
                </div>
            </div>

            {/* Full-width notes board */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 min-h-[calc(100vh-200px)]">
                <BrogliaccioBoard fullPage={true} />
            </div>
        </div>
    );
}
