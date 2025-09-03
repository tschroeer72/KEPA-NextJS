// Hilfsfunktion zum Ermitteln der Computer-/Browser-Informationen
import {NextRequest} from "next/server";

export function getComputerInfo(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = forwardedFor?.split(',')[0] || realIp || 'Unknown IP'

    // Browser und OS aus User-Agent extrahieren
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
