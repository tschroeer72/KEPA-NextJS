import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RundEmail } from "./_components/rund-email";
import { EmailEntwickler } from "./_components/email-entwickler";

export default function EmailPage() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="mb-6 text-3xl font-bold text-center">Email Verwaltung</h1>

            <Tabs defaultValue="rund-email" className="w-full mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rund-email">Rund-Email</TabsTrigger>
                    <TabsTrigger value="email-entwickler">E-Mail an Entwickler</TabsTrigger>
                </TabsList>
                <TabsContent value="rund-email" className="mt-4">
                    <RundEmail />
                </TabsContent>
                <TabsContent value="email-entwickler" className="mt-4">
                    <EmailEntwickler />
                </TabsContent>
            </Tabs>
        </div>
    )
}