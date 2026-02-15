import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getComputerInfoFromHeaders(): Promise<string> {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown Browser'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const remoteAddr = forwardedFor?.split(',')[0] || realIp || 'Unknown IP'

    let browserInfo = 'Unknown'
    if (userAgent.includes('Chrome')) browserInfo = 'Chrome'
    else if (userAgent.includes('Firefox')) browserInfo = 'Firefox'
    else if (userAgent.includes('Safari')) browserInfo = 'Safari'
    else if (userAgent.includes('Edge')) browserInfo = 'Edge'

    let osInfo = 'Unknown OS'
    if (userAgent.includes('Windows NT 10.0')) osInfo = 'Windows 10/11'
    else if (userAgent.includes('Windows NT 6.3')) osInfo = 'Windows 8.1'
    else if (userAgent.includes('Windows NT 6.1')) osInfo = 'Windows 7'
    else if (userAgent.includes('Macintosh')) osInfo = 'macOS'
    else if (userAgent.includes('Linux')) osInfo = 'Linux'
    else if (userAgent.includes('Android')) osInfo = 'Android'
    else if (userAgent.includes('iPhone')) osInfo = 'iOS'

    return `${remoteAddr}-${browserInfo}-${osInfo}`
}

export async function createChangeLogAction(tablename: string, changeType: string, sql: string) {
    const computerInfo = await getComputerInfoFromHeaders()
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
        console.error('Changelog error:', changelogError)
    }
}
