import { Request, Response, NextFunction } from 'express'

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler — must have 4 parameters for Express to treat it as
// an error-handling middleware.
// ─────────────────────────────────────────────────────────────────────────────

export interface AppError extends Error {
  status?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'

  if (status === 500) {
    console.error('[ERROR]', err)
  }

  res.status(status).json({ error: message })
}
