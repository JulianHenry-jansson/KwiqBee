#!/usr/bin/env tsx
/**
 * BiKoll End-to-End Pipeline Test
 *
 * Tests the full pipeline:
 *  1. AI server /health
 *  2. Audio upload → /transcribe
 *  3. JSON response parsing (3 cases)
 *  4. Supabase insert
 *  5. Supabase read-back verification
 *
 * Usage:
 *   npx tsx scripts/testPipeline.ts
 *
 * Environment variables (set in .env or inline):
 *   AI_SERVER_URL   — default http://localhost:8000
 *   SUPABASE_URL    — default http://localhost:54321
 *   SUPABASE_KEY    — your anon key
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ────────────────────────────────────────────────────────────────────

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Inline shared helpers (to avoid monorepo build dependency) ────────────────

interface HiveInspection {
    queen_seen: boolean;
    queen_color: string | null;
    brood_frames: number | null;
    treatment: string | null;
    colony_strength: string | null;
    notes: string;
}

const REQUIRED_FIELDS: (keyof HiveInspection)[] = [
    'queen_seen',
    'queen_color',
    'brood_frames',
    'treatment',
    'colony_strength',
    'notes',
];

function parseInspectionResponse(response: any): HiveInspection {
    let parsed: any;

    if (response?.result) {
        if (typeof response.result === 'string') {
            try {
                parsed = JSON.parse(response.result);
            } catch {
                throw new Error('Failed to parse stringified JSON in result');
            }
        } else {
            parsed = response.result;
        }
    } else {
        parsed = response;
    }

    // Basic validation — check required fields exist
    for (const field of REQUIRED_FIELDS) {
        if (!(field in parsed)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (typeof parsed.queen_seen !== 'boolean') {
        throw new Error(`queen_seen must be boolean, got ${typeof parsed.queen_seen}`);
    }

    return parsed as HiveInspection;
}

// ─── Test Utilities ────────────────────────────────────────────────────────────

interface TestResult {
    name: string;
    status: 'OK' | 'FAIL' | 'SKIP';
    duration: number;
    error?: string;
    data?: any;
}

const results: TestResult[] = [];

function log(icon: string, msg: string) {
    console.log(`  ${icon} ${msg}`);
}

function section(title: string) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('─'.repeat(60));
}

// ─── Test 1: AI Server Health ──────────────────────────────────────────────────

async function testHealth(): Promise<TestResult> {
    const start = Date.now();
    try {
        const res = await fetch(`${AI_SERVER_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        const duration = Date.now() - start;

        if (data.status === 'ok') {
            log('✅', `AI server healthy (${duration}ms)`);
            return { name: 'AI server health', status: 'OK', duration };
        } else {
            log('❌', `AI server returned unexpected status: ${JSON.stringify(data)}`);
            return { name: 'AI server health', status: 'FAIL', duration, error: `Unexpected status: ${JSON.stringify(data)}` };
        }
    } catch (err: any) {
        const duration = Date.now() - start;
        log('❌', `AI server unreachable: ${err.message}`);
        return { name: 'AI server health', status: 'FAIL', duration, error: err.message };
    }
}

// ─── Test 2: Audio Upload & Transcription ──────────────────────────────────────

async function testAudioUpload(): Promise<TestResult> {
    const start = Date.now();

    // Find sample audio file
    const samplePaths = [
        path.resolve(__dirname, '..', 'apps', 'mobile', 'assets', 'sample-inspection.m4a'),
        path.resolve(__dirname, '..', 'test.wav.m4a'),
        path.resolve(__dirname, '..', 'test.m4a'),
    ];

    let samplePath: string | null = null;
    for (const p of samplePaths) {
        if (fs.existsSync(p)) {
            samplePath = p;
            break;
        }
    }

    if (!samplePath) {
        log('⚠️', 'No sample audio file found. Skipping audio upload test.');
        log('  ', `Searched: ${samplePaths.join(', ')}`);
        return {
            name: 'Audio upload',
            status: 'SKIP',
            duration: Date.now() - start,
            error: 'No sample audio file found',
        };
    }

    log('📁', `Using sample: ${path.basename(samplePath)}`);

    try {
        const fileBuffer = fs.readFileSync(samplePath);
        const blob = new Blob([fileBuffer], { type: 'audio/m4a' });

        const formData = new FormData();
        formData.append('file', blob, 'inspection.m4a');

        const res = await fetch(`${AI_SERVER_URL}/transcribe`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(60000), // 60s for transcription
        });

        const data = await res.json();
        const duration = Date.now() - start;

        log('📦', `Raw response: ${JSON.stringify(data).slice(0, 200)}...`);

        return { name: 'Audio upload', status: 'OK', duration, data };
    } catch (err: any) {
        const duration = Date.now() - start;
        log('❌', `Audio upload failed: ${err.message}`);
        return { name: 'Audio upload', status: 'FAIL', duration, error: err.message };
    }
}

// ─── Test 3: JSON Parsing Validation ───────────────────────────────────────────

function testJsonParsing(): TestResult[] {
    const MOCK: HiveInspection = {
        queen_seen: true,
        queen_color: 'blue',
        brood_frames: 3,
        treatment: 'Oxalic Acid',
        colony_strength: 'Strong',
        notes: 'Colony looks healthy.',
    };

    const cases = [
        { name: 'JSON string in result', input: { result: JSON.stringify(MOCK) } },
        { name: 'JSON object in result', input: { result: { ...MOCK } } },
        { name: 'Flat JSON object', input: { ...MOCK } },
    ];

    return cases.map(({ name, input }) => {
        const start = Date.now();
        try {
            const parsed = parseInspectionResponse(input);
            const duration = Date.now() - start;

            // Verify parsed matches mock
            const valid =
                parsed.queen_seen === MOCK.queen_seen &&
                parsed.queen_color === MOCK.queen_color &&
                parsed.brood_frames === MOCK.brood_frames;

            if (valid) {
                log('✅', `Parse case "${name}" — OK`);
                return { name: `JSON parse: ${name}`, status: 'OK' as const, duration, data: parsed };
            } else {
                log('❌', `Parse case "${name}" — values don't match`);
                return { name: `JSON parse: ${name}`, status: 'FAIL' as const, duration, error: 'Parsed values mismatch' };
            }
        } catch (err: any) {
            const duration = Date.now() - start;
            log('❌', `Parse case "${name}" — ${err.message}`);
            return { name: `JSON parse: ${name}`, status: 'FAIL' as const, duration, error: err.message };
        }
    });
}

// ─── Test 4: Supabase Insert ───────────────────────────────────────────────────

async function testSupabaseInsert(inspectionData?: HiveInspection): Promise<TestResult> {
    const start = Date.now();

    const payload = {
        hive_id: '00000000-0000-0000-0000-000000000001', // test UUID
        user_id: '00000000-0000-0000-0000-000000000000', // test user
        queen_seen: inspectionData?.queen_seen ?? true,
        queen_color: inspectionData?.queen_color ?? 'blue',
        brood_frames: inspectionData?.brood_frames ?? 3,
        colony_strength: inspectionData?.colony_strength ?? 'Strong',
        treatment: inspectionData?.treatment ?? 'Oxalic Acid',
        notes: inspectionData?.notes ?? 'Pipeline test insertion',
        transcript: 'test-pipeline-transcript',
        audio_url: '',
    };

    try {
        const { data, error } = await supabase.from('inspections').insert(payload).select();
        const duration = Date.now() - start;

        if (error) {
            log('❌', `Supabase insert failed: ${error.message}`);
            return { name: 'Supabase insert', status: 'FAIL', duration, error: error.message };
        }

        const insertedId = data?.[0]?.id;
        log('✅', `Supabase insert success (id: ${insertedId}, ${duration}ms)`);
        return { name: 'Supabase insert', status: 'OK', duration, data: { id: insertedId } };
    } catch (err: any) {
        const duration = Date.now() - start;
        log('❌', `Supabase insert error: ${err.message}`);
        return { name: 'Supabase insert', status: 'FAIL', duration, error: err.message };
    }
}

// ─── Test 5: Supabase Read ─────────────────────────────────────────────────────

async function testSupabaseRead(insertedId?: string): Promise<TestResult> {
    const start = Date.now();

    try {
        let query = supabase
            .from('inspections')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        // If we have a specific ID, verify it exists
        if (insertedId) {
            query = supabase
                .from('inspections')
                .select('*')
                .eq('id', insertedId);
        }

        const { data, error } = await query;
        const duration = Date.now() - start;

        if (error) {
            log('❌', `Supabase read failed: ${error.message}`);
            return { name: 'Supabase read', status: 'FAIL', duration, error: error.message };
        }

        if (!data || data.length === 0) {
            log('❌', 'Supabase read returned no data');
            return { name: 'Supabase read', status: 'FAIL', duration, error: 'No records found' };
        }

        log('✅', `Supabase read success (${data.length} record(s), ${duration}ms)`);

        if (insertedId) {
            const record = data[0];
            log('  ', `  queen_seen: ${record.queen_seen}`);
            log('  ', `  queen_color: ${record.queen_color}`);
            log('  ', `  brood_frames: ${record.brood_frames}`);
            log('  ', `  treatment: ${record.treatment}`);
        }

        return { name: 'Supabase read', status: 'OK', duration, data };
    } catch (err: any) {
        const duration = Date.now() - start;
        log('❌', `Supabase read error: ${err.message}`);
        return { name: 'Supabase read', status: 'FAIL', duration, error: err.message };
    }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🐝 BiKoll Integration Test Pipeline');
    console.log('═'.repeat(60));
    console.log(`  AI Server:  ${AI_SERVER_URL}`);
    console.log(`  Supabase:   ${SUPABASE_URL}`);
    console.log(`  Timestamp:  ${new Date().toISOString()}`);

    // ── 1. Health check
    section('Step 1 — AI Server Health Check');
    const healthResult = await testHealth();
    results.push(healthResult);

    // ── 2. Audio upload
    section('Step 2 — Audio Upload & Transcription');
    let uploadedData: any = null;
    if (healthResult.status === 'OK') {
        const uploadResult = await testAudioUpload();
        results.push(uploadResult);
        if (uploadResult.status === 'OK') {
            uploadedData = uploadResult.data;
        }
    } else {
        log('⏭️', 'Skipping — AI server is not available');
        results.push({ name: 'Audio upload', status: 'SKIP', duration: 0, error: 'AI server unavailable' });
    }

    // ── 3. JSON parsing validation
    section('Step 3 — JSON Parsing Validation');
    const parseResults = testJsonParsing();
    results.push(...parseResults);

    // Also try to parse the actual upload response if available
    if (uploadedData) {
        const start = Date.now();
        try {
            const parsed = parseInspectionResponse(uploadedData);
            log('✅', `Live response parsed successfully`);
            results.push({ name: 'JSON parse: live response', status: 'OK', duration: Date.now() - start, data: parsed });
        } catch (err: any) {
            log('❌', `Live response parse failed: ${err.message}`);
            results.push({ name: 'JSON parse: live response', status: 'FAIL', duration: Date.now() - start, error: err.message });
        }
    }

    // ── 4. Supabase insert
    section('Step 4 — Supabase Insert');
    const parsedInspection = uploadedData ? (() => {
        try { return parseInspectionResponse(uploadedData); } catch { return undefined; }
    })() : undefined;
    const insertResult = await testSupabaseInsert(parsedInspection);
    results.push(insertResult);

    // ── 5. Supabase read
    section('Step 5 — Supabase Read Verification');
    const insertedId = insertResult.data?.id;
    const readResult = await testSupabaseRead(insertedId);
    results.push(readResult);

    // ── Report
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  🐝 BiKoll Integration Test Results');
    console.log('═'.repeat(60));
    console.log('');

    const maxNameLen = Math.max(...results.map((r) => r.name.length));

    for (const r of results) {
        const icon = r.status === 'OK' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
        const pad = ' '.repeat(maxNameLen - r.name.length);
        const timing = r.duration > 0 ? ` (${r.duration}ms)` : '';
        const errMsg = r.error ? ` — ${r.error}` : '';
        console.log(`  ${icon}  ${r.name}${pad}  ${r.status}${timing}${errMsg}`);
    }

    const okCount = results.filter((r) => r.status === 'OK').length;
    const failCount = results.filter((r) => r.status === 'FAIL').length;
    const skipCount = results.filter((r) => r.status === 'SKIP').length;

    console.log('');
    console.log('─'.repeat(60));
    const overall = failCount === 0 ? 'SUCCESS' : 'FAILURE';
    const overallIcon = failCount === 0 ? '✅' : '❌';
    console.log(`  ${overallIcon} Pipeline: ${overall}  (${okCount} passed, ${failCount} failed, ${skipCount} skipped)`);
    console.log('─'.repeat(60));
    console.log('');

    process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error('\n💥 Pipeline test crashed:', err);
    process.exit(1);
});
