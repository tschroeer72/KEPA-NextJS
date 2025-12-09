import {getComputerInfo} from "@/utils/get-computer-info";
import {NextRequest} from "next/server";
import { prisma } from "@/lib/prisma";

export async function CreateChangeLogAsync(request: NextRequest, tablename:string, changeType: string, sql: string) {
    const computerInfo = getComputerInfo(request)
    const currentDateTime = new Date()

    try {
        await prisma.tblDBChangeLog.create({
            data: {
                Computername: computerInfo,
                Tablename: tablename,
                Changetype: changeType,
                Command: sql,
                Zeitstempel: currentDateTime,
            }
        })
    } catch (changelogError) {
        // Changelog-Fehler sollte den Hauptvorgang nicht beeinträchtigen
        console.error('Changelog error:', changelogError)
    }
}