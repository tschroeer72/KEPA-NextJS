import fs from 'fs'
import path from 'path'

// Funktion zum Lesen des Prisma Schemas
function parsePrismaSchema(): Model[] {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')

    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Prisma Schema nicht gefunden! Bitte führen Sie erst "npx prisma init" aus.')
        process.exit(1)
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    const models: Model[] = []

    // Einfacher Parser für Prisma Models
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g
    let match

    while ((match = modelRegex.exec(schemaContent)) !== null) {
        const modelName = match[1]
        const modelBody = match[2]

        // Felder extrahieren (ohne id, createdAt, updatedAt, Relations)
        const fieldRegex = /(\w+)\s+(\w+)(?:\?)?(?:\s+@[^@\n]*)?/g
        const fields: string[] = []
        let fieldMatch

        while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
            const fieldName = fieldMatch[1]
            const fieldType = fieldMatch[2]

            // System-Felder und Relations überspringen
            if (
                fieldName !== 'id' &&
                fieldName !== 'createdAt' &&
                fieldName !== 'updatedAt' &&
                !fieldType.includes('[]') && // Arrays (Relations) überspringen
                !modelBody.includes(`${fieldName}.*@relation`) // Relations überspringen
            ) {
                fields.push(fieldName)
            }
        }

        if (fields.length > 0) {
            models.push({ name: modelName, fields })
        }
    }

    return models
}

interface Model {
    name: string
    fields: string[]
}

function generateRouteTemplate(modelName: string, fields: string[]): string {
    //const lowerModel = modelName.toLowerCase()
    const lowerModel = modelName
    const pluralModel = `${lowerModel}s`

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle ${pluralModel} abrufen
export async function GET() {
  try {
    const ${pluralModel} = await prisma.${lowerModel}.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(${pluralModel})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der ${pluralModel}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen ${modelName} erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung
    ${fields.map(field => `if (!body.${field} && body.${field} !== false && body.${field} !== 0) {
      return NextResponse.json(
        { error: '${field} ist erforderlich' },
        { status: 400 }
      )
    }`).join('\n    ')}

    const ${lowerModel} = await prisma.${lowerModel}.create({
      data: {
        ${fields.map(field => `${field}: body.${field}`).join(',\n        ')},
      }
    })

    return NextResponse.json(${lowerModel}, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des ${modelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
`
}

function generateIdRouteTemplate(modelName: string, fields: string[]): string {
    const lowerModel = modelName.toLowerCase()

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen ${modelName} abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    const ${lowerModel} = await prisma.${lowerModel}.findUnique({
      where: { id }
    })

    if (!${lowerModel}) {
      return NextResponse.json(
        { error: '${modelName} nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(${lowerModel})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des ${modelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - ${modelName} aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob ${modelName} existiert
    const existing${modelName} = await prisma.${lowerModel}.findUnique({
      where: { id }
    })

    if (!existing${modelName}) {
      return NextResponse.json(
        { error: '${modelName} nicht gefunden' },
        { status: 404 }
      )
    }

    const ${lowerModel} = await prisma.${lowerModel}.update({
      where: { id },
      data: {
        ${fields.map(field => `...(body.${field} !== undefined && { ${field}: body.${field} })`).join(',\n        ')},
      }
    })

    return NextResponse.json(${lowerModel})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des ${modelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - ${modelName} löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob ${modelName} existiert
    const existing${modelName} = await prisma.${lowerModel}.findUnique({
      where: { id }
    })

    if (!existing${modelName}) {
      return NextResponse.json(
        { error: '${modelName} nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.${lowerModel}.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: '${modelName} erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des ${modelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
`
}

// Haupt-Funktion
function generateCrudRoutes() {
    console.log('🚀 Starte CRUD-Route Generierung...\n')

    // Prisma Schema analysieren
    const models = parsePrismaSchema()

    if (models.length === 0) {
        console.error('❌ Keine Modelle im Prisma Schema gefunden!')
        process.exit(1)
    }

    console.log('📋 Gefundene Modelle:')
    models.forEach(model => {
        console.log(`  - ${model.name}: [${model.fields.join(', ')}]`)
    })
    console.log()

    // API-Ordner erstellen falls nicht vorhanden
    const apiDir = path.join('app', 'api')
    if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true })
        console.log('📁 API-Ordner erstellt')
    }

    // Routen für jedes Modell generieren
    models.forEach(model => {
        const pluralName = `${model.name.toLowerCase()}s`

        // Ordner erstellen
        const routeDir = path.join('app', 'api', 'db', pluralName)
        const idRouteDir = path.join(routeDir, '[id]')

        fs.mkdirSync(routeDir, { recursive: true })
        fs.mkdirSync(idRouteDir, { recursive: true })

        // Haupt-route.ts erstellen
        const mainRouteContent = generateRouteTemplate(model.name, model.fields)
        fs.writeFileSync(path.join(routeDir, 'route.ts'), mainRouteContent)

        // [id]/route.ts erstellen
        const idRouteContent = generateIdRouteTemplate(model.name, model.fields)
        fs.writeFileSync(path.join(idRouteDir, 'route.ts'), idRouteContent)

        console.log(`✅ ${model.name} CRUD-Routen erstellt:`)
        console.log(`   GET,POST /api/${pluralName}`)
        console.log(`   GET,PUT,DELETE /api/${pluralName}/[id]`)
    })

    console.log('\n🎉 CRUD-Routen erfolgreich generiert!')
    console.log('\n📖 Verwendung:')
    models.forEach(model => {
        const pluralName = `${model.name.toLowerCase()}s`
        console.log(`\n${model.name} API:`)
        console.log(`  GET    /api/${pluralName}          - Alle ${pluralName} abrufen`)
        console.log(`  POST   /api/${pluralName}          - Neuen ${model.name} erstellen`)
        console.log(`  GET    /api/${pluralName}/1        - ${model.name} mit ID 1 abrufen`)
        console.log(`  PUT    /api/${pluralName}/1        - ${model.name} mit ID 1 aktualisieren`)
        console.log(`  DELETE /api/${pluralName}/1        - ${model.name} mit ID 1 löschen`)
    })
}

// Script ausführen
generateCrudRoutes()