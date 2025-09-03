
import fs from 'fs'
import path from 'path'

interface FieldInfo {
    name: string
    type: string
    isOptional: boolean
}

interface Model {
    name: string
    fields: FieldInfo[]
}

// Interface für Request Body Typ
interface RequestBody {
    [key: string]: string | number | boolean | Date | null | undefined
}

// Interface für Update-Daten
interface UpdateData {
    [key: string]: string | number | boolean | Date
}

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
    let match: RegExpExecArray | null

    while ((match = modelRegex.exec(schemaContent)) !== null) {
        const modelName = match[1]
        const modelBody = match[2]

        // Felder extrahieren (ohne id, createdAt, updatedAt, Relations)
        const fieldRegex = /(\w+)\s+(\w+)(\?)?(?:\s+@[^@\n]*)?/g
        const fields: FieldInfo[] = []
        let fieldMatch: RegExpExecArray | null

        while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
            const fieldName = fieldMatch[1]
            const fieldType = fieldMatch[2]
            const isOptional = fieldMatch[3] === '?'

            // System-Felder und Relations überspringen
            if (
                fieldName !== 'id' &&
                fieldName !== 'ID' &&
                fieldName !== 'createdAt' &&
                fieldName !== 'updatedAt' &&
                !fieldType.includes('[]') && // Arrays (Relations) überspringen
                !modelBody.includes(`${fieldName}.*@relation`) // Relations überspringen
            ) {
                fields.push({
                    name: fieldName,
                    type: fieldType,
                    isOptional
                })
            }
        }

        if (fields.length > 0) {
            models.push({ name: modelName, fields })
        }
    }

    return models
}

// Funktion zum Entfernen des "tbl" Präfixes für Route-Namen
function removeTablePrefix(modelName: string): string {
    return modelName.startsWith('tbl') ? modelName.substring(3) : modelName
}

// Funktion zur Bestimmung des korrekten Datentyps für TypeScript/JavaScript
function getCorrectValue(fieldType: string, fieldName: string): string {
    const lowerType = fieldType.toLowerCase()

    if (lowerType === 'int') {
        return `Number(body.${fieldName})`
    }
    if (lowerType === 'float' || lowerType === 'double' || lowerType === 'decimal') {
        return `Number(body.${fieldName})`
    }
    if (lowerType === 'boolean' || lowerType === 'bool') {
        return `Boolean(body.${fieldName})`
    }
    if (lowerType === 'datetime') {
        return `new Date(body.${fieldName} as string | number | Date)`
    }

    // Alle anderen Typen (String, VarChar, Text, etc.) als String
    return `String(body.${fieldName})`
}

// Funktion zur korrekten Darstellung in SQL-Queries
function getSqlValue(fieldType: string, fieldName: string): string {
    const lowerType = fieldType.toLowerCase()

    if (lowerType === 'int' || lowerType === 'float' || lowerType === 'double' || lowerType === 'decimal') {
        return `\${body.${fieldName}}`
    }
    if (lowerType === 'boolean' || lowerType === 'bool') {
        return `\${body.${fieldName} ? 1 : 0}`
    }
    if (lowerType === 'datetime') {
        return `'\${new Date(body.${fieldName} as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}'`
    }

    // Alle String-Typen in Anführungszeichen
    return `'\${body.${fieldName}}'`
}

function generateRouteTemplate(modelName: string, fields: FieldInfo[]): string {
    const cleanModelName = removeTablePrefix(modelName)
    const routeName = cleanModelName.toLowerCase()
    const variableName = `data${cleanModelName}`
    const fieldsForInsert = fields.filter(field => !field.name.includes('tbl'))

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

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
  } catch (error: unknown) {
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    ${fieldsForInsert.filter(field => !field.isOptional).map(field => `if (body.${field.name} === undefined || body.${field.name} === null) {
      return NextResponse.json(
        { error: '${field.name} ist erforderlich' },
        { status: 400 }
      )
    }`).join('\n    ')}

    const ${variableName} = await prisma.${modelName}.create({
      data: {
        ${fieldsForInsert.map(field => `${field.name}: ${getCorrectValue(field.type, field.name)}`).join(',\n        ')},
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = \`insert into ${modelName}(ID, ${fieldsForInsert.map(f => f.name).join(', ')}) values (\${${variableName}.ID}, ${fieldsForInsert.map(field => getSqlValue(field.type, field.name)).join(', ')})\`
    await CreateChangeLogAsync(request, "${modelName}", "insert", insertCommand)

    return NextResponse.json(${variableName}, { status: 201 })
  } catch (error: unknown) {
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

function generateIdRouteTemplate(modelName: string, fields: FieldInfo[]): string {
    const cleanModelName = removeTablePrefix(modelName)
    const routeName = cleanModelName.toLowerCase()
    const variableName = `data${cleanModelName}`
    const fieldsForUpdate = fields.filter(field => !field.name.includes('tbl'))

    return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = ${JSON.stringify(fieldsForUpdate, null, 2)};

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
  } catch (error: unknown) {
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    ${fieldsForUpdate.map(field => `if (body.${field.name} !== undefined && body.${field.name} !== null) {
      updateData.${field.name} = ${getCorrectValue(field.type, field.name)}
    }`).join('\n    ')}

    const ${variableName} = await prisma.${modelName}.update({
      where: { ID: id },
      data: updateData
    })

    // Erfolgreicher PUT - Jetzt Changelog-Eintrag erstellen
    const updateFields = Object.entries(body)
      .filter(([key, value]) => key !== 'ID' && value !== undefined && value !== null)
      .map(([key, value]) => {
        const field = fieldsForUpdate.find((f: { name: string; type: string; isOptional: boolean }) => f.name === key)
        if (!field) return \`\${key}='\${value}'\`
        
        const fieldType = field.type.toLowerCase()
        if (fieldType === 'int' || fieldType === 'float' || fieldType === 'double' || fieldType === 'decimal') {
          return \`\${key}=\${value}\`
        }
        if (fieldType === 'boolean' || fieldType === 'bool') {
          return \`\${key}=\${value ? 1 : 0}\`
        }
        if (fieldType === 'datetime') {
          return \`\${key}='\${new Date(value as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}'\`
        }
        return \`\${key}='\${value}'\`
      })
      .join(', ')
    
    const updateCommand = \`update ${modelName} set \${updateFields} where ID=\${id}\`
    await CreateChangeLogAsync(request, "${modelName}", "update", updateCommand)

    return NextResponse.json(${variableName})
  } catch (error: unknown) {
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = \`delete from ${modelName} where ID=\${id}\`
    await CreateChangeLogAsync(request, "${modelName}", "delete", deleteCommand)

    return NextResponse.json(
      { message: '${cleanModelName} erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
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
function generateCrudRoutes(): void {
    console.log('🚀 Starte CRUD-Route Generierung...\n')

    // Prisma Schema analysieren
    const models = parsePrismaSchema()

    if (models.length === 0) {
        console.error('❌ Keine Modelle im Prisma Schema gefunden!')
        process.exit(1)
    }

    console.log('📋 Gefundene Modelle:')
    models.forEach(model => {
        console.log(`  - ${model.name}: [${model.fields.map(f => `${f.name}:${f.type}${f.isOptional ? '?' : ''}`).join(', ')}]`)
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