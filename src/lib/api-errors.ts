import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/** Uniform validation-failure body: { error, details: [{ field, message }] }. */
export function validationErrorResponse(error: ZodError) {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return NextResponse.json({ error: 'Validation failed.', details }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
