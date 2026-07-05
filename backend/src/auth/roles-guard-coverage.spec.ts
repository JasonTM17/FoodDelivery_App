import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

describe('controller role guard coverage', () => {
  it('requires RolesGuard wherever a controller declares @Roles metadata', () => {
    const controllerFiles = findControllerFiles(join(__dirname, '..'))
    const missingGuard = controllerFiles
      .filter(file => {
        const source = readFileSync(file, 'utf8')
        return source.includes('@Roles(') && !/@UseGuards\([\s\S]*?RolesGuard[\s\S]*?\)/.test(source)
      })
      .map(file => file.replace(process.cwd(), '').replace(/^[\\/]/, ''))

    expect(missingGuard).toEqual([])
  })
})

function findControllerFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const absolutePath = join(dir, entry)
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      files.push(...findControllerFiles(absolutePath))
    } else if (entry.endsWith('.controller.ts')) {
      files.push(absolutePath)
    }
  }
  return files
}
