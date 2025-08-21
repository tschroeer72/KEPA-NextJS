import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const mgl = await prisma.tblMitglieder.findMany()
    //console.log(mgl)
    return Response.json(mgl, {status: 200})
}