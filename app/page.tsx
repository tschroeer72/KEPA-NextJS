import Image from "next/image";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-6 text-3xl font-bold">Herzlich Willkommen bei KEPA</h1>
            <div className="relative">
                <Image
                    src="/Vereinspokal.png"
                    alt="Vereinspokal Logo"
                    width={1200}
                    height={1600}
                    className="max-h-96 w-auto object-contain"
                    priority
                />
            </div>
        </div>
    );
}