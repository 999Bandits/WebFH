"use client";

interface ArchiveGameButtonProps {
    gameName: string;
}

export default function ArchiveGameButton({ gameName }: ArchiveGameButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        console.log("Archive button clicked for:", gameName);
        if (!confirm(`Apakah Anda yakin ingin mengarsipkan "${gameName}"? Game ini tidak akan bisa dipilih lagi.`)) {
            e.preventDefault();
            console.log("Archiving cancelled by user.");
        } else {
            console.log("Archiving confirmed by user.");
        }
    };

    return (
        <button
            type="submit"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            onClick={handleClick}
        >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Arsip
        </button>
    );
}
