import { z } from 'zod';

export const HiveInspectionSchema = z.object({
  queen_seen: z.boolean(),
  queen_color: z.string().nullable(),
  brood_frames: z.number().nullable(),
  treatment: z.string().nullable(),
  colony_strength: z.string().nullable(),
  notes: z.string(),
});

export type HiveInspection = z.infer<typeof HiveInspectionSchema>;

export function parseInspectionResponse(response: any): HiveInspection {
  let parsed: any;

  if (response?.result) {
    if (typeof response.result === 'string') {
      try {
        parsed = JSON.parse(response.result);
      } catch (e) {
        throw new Error("Failed to parse stringified JSON in result");
      }
    } else {
      parsed = response.result;
    }
  } else {
    parsed = response;
  }

  return HiveInspectionSchema.parse(parsed);
}

// ─── Test Utilities ───────────────────────────────────────────────────

export interface TestResult {
  name: string;
  status: 'OK' | 'FAIL';
  duration?: number;
  error?: string;
  data?: any;
}

export const MOCK_INSPECTION: HiveInspection = {
  queen_seen: true,
  queen_color: 'blue',
  brood_frames: 3,
  treatment: 'Oxalic Acid',
  colony_strength: 'Strong',
  notes: 'Colony looks healthy.',
};

/** Case 1: result is a JSON string */
export const MOCK_RESPONSE_STRING = {
  result: JSON.stringify(MOCK_INSPECTION),
};

/** Case 2: result is a JSON object */
export const MOCK_RESPONSE_OBJECT = {
  result: { ...MOCK_INSPECTION },
};

/** Case 3: flat object (no wrapper) */
export const MOCK_RESPONSE_FLAT = {
  ...MOCK_INSPECTION,
};

/**
 * Run all 3 JSON parsing validation tests.
 * Returns an array of TestResult objects.
 */
export function runValidationTests(): TestResult[] {
  const cases = [
    { name: 'Case 1 — JSON string in result', input: MOCK_RESPONSE_STRING },
    { name: 'Case 2 — JSON object in result', input: MOCK_RESPONSE_OBJECT },
    { name: 'Case 3 — Flat JSON object', input: MOCK_RESPONSE_FLAT },
  ];

  return cases.map(({ name, input }) => {
    const start = Date.now();
    try {
      const parsed = parseInspectionResponse(input);
      return {
        name,
        status: 'OK' as const,
        duration: Date.now() - start,
        data: parsed,
      };
    } catch (err: any) {
      return {
        name,
        status: 'FAIL' as const,
        duration: Date.now() - start,
        error: err.message,
        data: input,
      };
    }
  });
}
