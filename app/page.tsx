import Image from "next/image";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-3 text-3xl font-bold">Herzlich Willkommen bei KEPA</h1>
            <div className="relative">
                <Image
                    src="/Vereinspokal.png"
                    alt="Vereinspokal Logo"
                    width={1200}
                    height={1600}
                    className="h-[70vh] w-auto object-contain"
                    priority
                />
            </div>
        </div>
    );
}