const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const types = await prisma.tblMeisterschaftstyp.findMany()
  console.log(JSON.stringify(types, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
