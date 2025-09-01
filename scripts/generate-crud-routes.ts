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
                fieldName !== 'ID' &&
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

// Funktion zum Entfernen des "tbl" Präfixes für Route-Namen
function removeTablePrefix(modelName: string): string {
    return modelName.startsWith('tbl') ? modelName.substring(3) : modelName
}

function generateRouteTemplate(modelName: string, fields: string[]): string {
    const cleanModelName = removeTablePrefix(modelName)
    const routeName = cleanModelName.toLowerCase()
    const variableName = `data${cleanModelName}`

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle ${routeName} abrufen
export async function GET() {
  try {
    const ${variableName} = await prisma.${modelName}.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(${variableName})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der ${routeName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen ${cleanModelName} erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    ${fields.filter(field => !field.includes('tbl')).map(field => `if (body.${field} === undefined || body.${field} === null) {
      return NextResponse.json(
        { error: '${field} ist erforderlich' },
        { status: 400 }
      )
    }`).join('\n    ')}

    const ${variableName} = await prisma.${modelName}.create({
      data: {
        ${fields.filter(field => !field.includes('tbl')).map(field => `${field}: body.${field}`).join(',\n        ')},
      }
    })

    return NextResponse.json(${variableName}, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des ${cleanModelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
`
}

function generateIdRouteTemplate(modelName: string, fields: string[]): string {
    const cleanModelName = removeTablePrefix(modelName)
    const routeName = cleanModelName.toLowerCase()
    const variableName = `data${cleanModelName}`

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen ${cleanModelName} abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    const ${variableName} = await prisma.${modelName}.findUnique({
      where: { ID: id }
    })

    if (!${variableName}) {
      return NextResponse.json(
        { error: '${cleanModelName} nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(${variableName})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des ${cleanModelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - ${cleanModelName} aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob ${cleanModelName} existiert
    const existing${cleanModelName} = await prisma.${modelName}.findUnique({
      where: { ID: id }
    })

    if (!existing${cleanModelName}) {
      return NextResponse.json(
        { error: '${cleanModelName} nicht gefunden' },
        { status: 404 }
      )
    }

    const ${variableName} = await prisma.${modelName}.update({
      where: { ID: id },
      data: {
        ${fields.filter(field => !field.includes('tbl')).map(field => `...(body.${field} !== undefined && { ${field}: body.${field} })`).join(',\n        ')},
      }
    })

    return NextResponse.json(${variableName})
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des ${cleanModelName}' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - ${cleanModelName} löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob ${cleanModelName} existiert
    const existing${cleanModelName} = await prisma.${modelName}.findUnique({
      where: { ID: id }
    })

    if (!existing${cleanModelName}) {
      return NextResponse.json(
        { error: '${cleanModelName} nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.${modelName}.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: '${cleanModelName} erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des ${cleanModelName}' },
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
    const apiDir = path.join('app', 'api', 'db')
    if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true })
        console.log('📁 API-Ordner erstellt')
    }

    // Routen für jedes Modell generieren
    models.forEach(model => {
        const cleanModelName = removeTablePrefix(model.name)
        const routeName = cleanModelName.toLowerCase()

        // Ordner erstellen
        const routeDir = path.join('app', 'api', 'db', routeName)
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
        console.log(`   GET,POST /api/db/${routeName}`)
        console.log(`   GET,PUT,DELETE /api/db/${routeName}/[id]`)
    })

    console.log('\n🎉 CRUD-Routen erfolgreich generiert!')
    console.log('\n📖 Verwendung:')
    models.forEach(model => {
        const cleanModelName = removeTablePrefix(model.name)
        const routeName = cleanModelName.toLowerCase()
        console.log(`\n${cleanModelName} API:`)
        console.log(`  GET    /api/db/${routeName}          - Alle ${routeName} abrufen`)
        console.log(`  POST   /api/db/${routeName}          - Neuen ${cleanModelName} erstellen`)
        console.log(`  GET    /api/db/${routeName}/1        - ${cleanModelName} mit ID 1 abrufen`)
        console.log(`  PUT    /api/db/${routeName}/1        - ${cleanModelName} mit ID 1 aktualisieren`)
        console.log(`  DELETE /api/db/${routeName}/1        - ${cleanModelName} mit ID 1 löschen`)
    })
}

// Script ausführen
generateCrudRoutes()