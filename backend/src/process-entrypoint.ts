export type FoodFlowProcessRole = 'api' | 'worker'

export function resolveProcessEntrypoint(
  configuredRole: string | undefined = process.env.FOODFLOW_PROCESS_ROLE,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): './main' | './workers/main' {
  const role = configuredRole?.trim()
  if (!role) {
    if (nodeEnv === 'production') {
      throw new Error('FOODFLOW_PROCESS_ROLE is required in production')
    }
    return './main'
  }
  if (role === 'api') return './main'
  if (role === 'worker') return './workers/main'

  throw new Error(`Unsupported FOODFLOW_PROCESS_ROLE: ${role}`)
}

async function bootstrap(): Promise<void> {
  await import(resolveProcessEntrypoint())
}

if (require.main === module) {
  void bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown startup error'
    console.error(`FoodFlow process failed to start: ${message}`)
    process.exitCode = 1
  })
}
