import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';

// ─── Config ────────────────────────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Inline shared helpers (avoids monorepo build issues in Expo) ────
import { z } from 'zod';

const HiveInspectionSchema = z.object({
  queen_seen: z.boolean(),
  queen_color: z.string().nullable(),
  brood_frames: z.number().nullable(),
  treatment: z.string().nullable(),
  colony_strength: z.string().nullable(),
  notes: z.string(),
});

type HiveInspection = z.infer<typeof HiveInspectionSchema>;

function parseInspectionResponse(response: any): HiveInspection {
  let parsed: any;
  if (response?.result) {
    if (typeof response.result === 'string') {
      parsed = JSON.parse(response.result);
    } else {
      parsed = response.result;
    }
  } else {
    parsed = response;
  }
  return HiveInspectionSchema.parse(parsed);
}

// ─── Test utilities ─────────────────────────────────────────────────
interface TestResult {
  name: string;
  status: 'OK' | 'FAIL';
  duration?: number;
  error?: string;
  data?: any;
}

const MOCK_INSPECTION: HiveInspection = {
  queen_seen: true,
  queen_color: 'blue',
  brood_frames: 3,
  treatment: 'Oxalic Acid',
  colony_strength: 'Strong',
  notes: 'Colony looks healthy.',
};

function runValidationTests(): TestResult[] {
  const cases = [
    { name: 'Case 1 — JSON string in result', input: { result: JSON.stringify(MOCK_INSPECTION) } },
    { name: 'Case 2 — JSON object in result', input: { result: { ...MOCK_INSPECTION } } },
    { name: 'Case 3 — Flat JSON object', input: { ...MOCK_INSPECTION } },
  ];
  return cases.map(({ name, input }) => {
    const start = Date.now();
    try {
      const parsed = parseInspectionResponse(input);
      return { name, status: 'OK' as const, duration: Date.now() - start, data: parsed };
    } catch (err: any) {
      return { name, status: 'FAIL' as const, duration: Date.now() - start, error: err.message, data: input };
    }
  });
}

// ─── Types ──────────────────────────────────────────────────────────
type Screen = 'Home' | 'Hive' | 'Record' | 'Confirm';

interface LatencyMetrics {
  upload?: number;
  whisper?: number;
  qwen?: number;
  insert?: number;
}

interface DebugState {
  aiServerStatus: 'unknown' | 'online' | 'unreachable' | 'checking';
  lastTranscript: string | null;
  rawJson: string | null;
  parsedInspection: HiveInspection | null;
  supabaseInsertStatus: string | null;
  supabaseInsertResponse: string | null;
  latency: LatencyMetrics;
  validationResults: TestResult[];
  hiveInspections: any[];
}

// ═══════════════════════════════════════════════════════════════════════
// App Component
// ═══════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [selectedHive, setSelectedHive] = useState<any>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const [debug, setDebug] = useState<DebugState>({
    aiServerStatus: 'unknown',
    lastTranscript: null,
    rawJson: null,
    parsedInspection: null,
    supabaseInsertStatus: null,
    supabaseInsertResponse: null,
    latency: {},
    validationResults: [],
    hiveInspections: [],
  });

  const hives = [
    { id: '1', name: 'Bikupa 1' },
    { id: '2', name: 'Bikupa 2' },
    { id: '3', name: 'Bikupa 3' },
  ];

  const goHome = () => setCurrentScreen('Home');

  const openHive = (hive: any) => {
    setSelectedHive(hive);
    setCurrentScreen('Hive');
  };

  const startRecord = () => setCurrentScreen('Record');

  // ─── AI Server Health Check ────────────────────────────────────────
  const testAIServer = useCallback(async () => {
    setDebug((d) => ({ ...d, aiServerStatus: 'checking' }));
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      const data = await res.json();
      if (data.status === 'ok') {
        setDebug((d) => ({ ...d, aiServerStatus: 'online' }));
      } else {
        setDebug((d) => ({ ...d, aiServerStatus: 'unreachable' }));
      }
    } catch {
      setDebug((d) => ({ ...d, aiServerStatus: 'unreachable' }));
    }
  }, []);

  // Auto-check on mount if TEST_MODE
  useEffect(() => {
    if (TEST_MODE) testAIServer();
  }, [testAIServer]);

  // ─── Audio Recording ──────────────────────────────────────────────
  const handleStartRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    if (uri) {
      // Auto-trigger the full pipeline: upload → parse → save
      await processAudio(uri);
    }
  };

  // ─── Full pipeline: Upload → Whisper → Qwen → Parse → Save ────────
  const processAudio = async (fileUri: string) => {
    if (!selectedHive) return;

    setLoading(true);
    const latency: LatencyMetrics = {};

    try {
      // Step 1: Upload to GPU server (Whisper + Qwen)
      const uploadStart = Date.now();
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'audio/m4a',
        name: 'inspection.m4a',
      } as any);

      const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      latency.upload = Date.now() - uploadStart;

      const rawResponse = await res.json();
      const rawJsonStr = JSON.stringify(rawResponse, null, 2);

      setDebug((d) => ({
        ...d,
        rawJson: rawJsonStr,
        lastTranscript: rawResponse.transcript || rawResponse.result?.transcript || null,
        latency: { ...d.latency, upload: latency.upload },
      }));

      // Step 2: Parse Qwen JSON response
      const parsed = parseInspectionResponse(rawResponse);
      setParsedData(parsed);
      setDebug((d) => ({ ...d, parsedInspection: parsed }));

      // Step 3: Save to Supabase immediately
      const insertStart = Date.now();
      const payload = {
        hive_id: selectedHive.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        queen_seen: parsed.queen_seen,
        queen_color: parsed.queen_color,
        brood_frames: parsed.brood_frames,
        colony_strength: parsed.colony_strength,
        treatment: parsed.treatment,
        notes: parsed.notes || '',
        transcript: rawResponse.transcript || rawResponse.result?.transcript || '',
        audio_url: fileUri,
      };

      const { data, error } = await supabase.from('inspections').insert(payload).select();
      const insertTime = Date.now() - insertStart;

      if (error) {
        setDebug((d) => ({
          ...d,
          supabaseInsertStatus: 'Insert failed',
          supabaseInsertResponse: JSON.stringify(error, null, 2),
          latency: { ...d.latency, insert: insertTime },
        }));
        Alert.alert('Insert Failed', error.message);
      } else {
        setDebug((d) => ({
          ...d,
          supabaseInsertStatus: 'Insert success',
          supabaseInsertResponse: JSON.stringify(data, null, 2),
          latency: { ...d.latency, insert: insertTime },
        }));
        setCurrentScreen('Confirm');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Processing failed';
      setDebug((d) => ({
        ...d,
        rawJson: errorMsg,
        supabaseInsertStatus: null,
      }));
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Test upload with sample audio ─────────────────────────────────
  const handleTestUpload = async () => {
    const asset = require('./assets/sample-inspection.m4a');
    const assetModule = await import('expo-asset');
    const [loaded] = await assetModule.Asset.loadAsync(asset);
    if (loaded.localUri) {
      await processAudio(loaded.localUri);
    }
  };

  // ─── Supabase Read (Hive inspections) ─────────────────────────────
  const loadHiveInspections = useCallback(async (hiveId: string) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('hive_id', hiveId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase read error:', error.message);
      } else {
        setDebug((d) => ({ ...d, hiveInspections: data || [] }));
      }
    } catch (err: any) {
      console.error('Supabase read error:', err.message);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'Hive' && selectedHive) {
      loadHiveInspections(selectedHive.id);
    }
  }, [currentScreen, selectedHive, loadHiveInspections]);

  // ─── Run Validation Tests ─────────────────────────────────────────
  const handleRunValidation = () => {
    const results = runValidationTests();
    setDebug((d) => ({ ...d, validationResults: results }));
  };

  // ═══════════════════════════════════════════════════════════════════
  // Debug Panel Component
  // ═══════════════════════════════════════════════════════════════════
  const DebugPanel = () => {
    if (!TEST_MODE) return null;

    return (
      <View style={styles.debugContainer}>
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setDebugOpen(!debugOpen)}
        >
          <Text style={styles.debugToggleText}>
            🐝 Debug Panel {debugOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {debugOpen && (
          <ScrollView style={styles.debugContent} nestedScrollEnabled>
            {/* AI Server Status */}
            <View style={styles.debugSection}>
              <Text style={styles.debugLabel}>AI Server Status</Text>
              <Text style={[
                styles.debugValue,
                {
                  color: debug.aiServerStatus === 'online' ? '#4CAF50' :
                    debug.aiServerStatus === 'unreachable' ? '#f44336' : '#FF9800'
                }
              ]}>
                {debug.aiServerStatus === 'online' ? '✅ AI server online' :
                  debug.aiServerStatus === 'unreachable' ? '❌ AI server unreachable' :
                    debug.aiServerStatus === 'checking' ? '⏳ Checking...' : '❓ Unknown'}
              </Text>
              <Button title="Re-check /health" onPress={testAIServer} />
            </View>

            {/* Latency Metrics */}
            {(debug.latency.upload != null) && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>Latency Metrics</Text>
                {debug.latency.upload != null && (
                  <Text style={styles.debugMono}>Upload: {debug.latency.upload} ms</Text>
                )}
                {debug.latency.whisper != null && (
                  <Text style={styles.debugMono}>Whisper: {(debug.latency.whisper / 1000).toFixed(1)} s</Text>
                )}
                {debug.latency.qwen != null && (
                  <Text style={styles.debugMono}>Qwen: {(debug.latency.qwen / 1000).toFixed(1)} s</Text>
                )}
                {debug.latency.insert != null && (
                  <Text style={styles.debugMono}>Insert: {debug.latency.insert} ms</Text>
                )}
              </View>
            )}

            {/* Last Transcript */}
            {debug.lastTranscript && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>Last Transcript</Text>
                <Text style={styles.debugMono}>{debug.lastTranscript}</Text>
              </View>
            )}

            {/* Raw JSON */}
            {debug.rawJson && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>Raw JSON Response</Text>
                <ScrollView horizontal>
                  <Text style={styles.debugMono}>{debug.rawJson}</Text>
                </ScrollView>
              </View>
            )}

            {/* Parsed Inspection */}
            {debug.parsedInspection && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>Parsed Inspection</Text>
                <Text style={styles.debugMono}>
                  {JSON.stringify(debug.parsedInspection, null, 2)}
                </Text>
              </View>
            )}

            {/* Supabase Insert Status */}
            {debug.supabaseInsertStatus && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>Supabase Insert</Text>
                <Text style={[
                  styles.debugValue,
                  { color: debug.supabaseInsertStatus.includes('success') ? '#4CAF50' : '#f44336' }
                ]}>
                  {debug.supabaseInsertStatus}
                </Text>
                {debug.supabaseInsertResponse && (
                  <ScrollView horizontal>
                    <Text style={styles.debugMono}>{debug.supabaseInsertResponse}</Text>
                  </ScrollView>
                )}
              </View>
            )}

            {/* Validation Tests */}
            <View style={styles.debugSection}>
              <Text style={styles.debugLabel}>JSON Validation Tests</Text>
              <Button title="Run Validation Tests" onPress={handleRunValidation} />
              {debug.validationResults.map((r, i) => (
                <Text key={i} style={[
                  styles.debugMono,
                  { color: r.status === 'OK' ? '#4CAF50' : '#f44336' }
                ]}>
                  {r.status === 'OK' ? '✅' : '❌'} {r.name} — {r.status}
                  {r.error ? ` (${r.error})` : ''}
                </Text>
              ))}
            </View>

            {/* Hive Inspections */}
            {debug.hiveInspections.length > 0 && (
              <View style={styles.debugSection}>
                <Text style={styles.debugLabel}>
                  Hive Inspections ({debug.hiveInspections.length})
                </Text>
                {debug.hiveInspections.map((insp, i) => (
                  <View key={i} style={styles.debugInspectionRow}>
                    <Text style={styles.debugMono}>
                      #{i + 1} | Queen: {insp.queen_seen ? 'Y' : 'N'} |
                      Brood: {insp.brood_frames ?? '-'} |
                      Strength: {insp.colony_strength ?? '-'} |
                      {insp.created_at ? new Date(insp.created_at).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BiKoll</Text>
        {TEST_MODE && (
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>TEST</Text>
          </View>
        )}
        {currentScreen !== 'Home' && (
          <Button
            title="Back"
            onPress={() =>
              currentScreen === 'Confirm'
                ? setCurrentScreen('Record')
                : currentScreen === 'Record'
                  ? setCurrentScreen('Hive')
                  : goHome()
            }
          />
        )}
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFA000" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* ─── Home Screen ────────────────────────────────────────── */}
      {currentScreen === 'Home' && (
        <FlatList
          data={hives}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openHive(item)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ─── Hive Screen ────────────────────────────────────────── */}
      {currentScreen === 'Hive' && selectedHive && (
        <ScrollView style={styles.content}>
          <Text style={styles.heading}>{selectedHive.name}</Text>

          {debug.hiveInspections.length > 0 ? (
            <View style={styles.dataCard}>
              <Text style={styles.sub}>Latest Inspection</Text>
              <Text style={styles.dataRow}>
                Queen Seen: {debug.hiveInspections[0].queen_seen ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.dataRow}>
                Queen Color: {debug.hiveInspections[0].queen_color || 'N/A'}
              </Text>
              <Text style={styles.dataRow}>
                Brood Frames: {debug.hiveInspections[0].brood_frames ?? 'N/A'}
              </Text>
              <Text style={styles.dataRow}>
                Treatment: {debug.hiveInspections[0].treatment || 'None'}
              </Text>
              <Text style={styles.dataRow}>
                Strength: {debug.hiveInspections[0].colony_strength || 'Unknown'}
              </Text>
              <Text style={styles.dataRow}>
                Notes: {debug.hiveInspections[0].notes || '-'}
              </Text>
            </View>
          ) : (
            <Text style={styles.sub}>No inspections yet.</Text>
          )}

          <View style={styles.buttonContainer}>
            <Button title="Record New Inspection" onPress={startRecord} />
          </View>
        </ScrollView>
      )}

      {/* ─── Record Screen ──────────────────────────────────────── */}
      {currentScreen === 'Record' && (
        <ScrollView style={styles.content}>
          <Text style={styles.heading}>Record Audio</Text>
          <Text style={styles.sub}>
            {recording ? 'Recording... Press Stop when done.' : 'Press Start to begin recording.'}
          </Text>
          <View style={styles.recordButtons}>
            <Button
              title={recording ? 'Recording...' : 'Start Recording'}
              onPress={handleStartRecording}
              disabled={!!recording || loading}
            />
            <Button title="Stop & Analyze" onPress={handleStopRecording} disabled={!recording || loading} />
          </View>

          {/* Test Upload button (TEST_MODE only) */}
          {TEST_MODE && (
            <View style={styles.testButton}>
              <Button
                title="Test Upload (sample audio)"
                onPress={handleTestUpload}
                color="#FF9800"
                disabled={loading}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── Confirm Screen ─────────────────────────────────────── */}
      {currentScreen === 'Confirm' && parsedData && (
        <ScrollView style={styles.content}>
          <Text style={styles.heading}>Inspection Saved</Text>
          <View style={styles.dataCard}>
            <Text style={styles.dataRow}>Queen Seen: {parsedData.queen_seen ? 'Yes' : 'No'}</Text>
            <Text style={styles.dataRow}>Queen Color: {parsedData.queen_color}</Text>
            <Text style={styles.dataRow}>Brood Frames: {parsedData.brood_frames}</Text>
            <Text style={styles.dataRow}>Treatment: {parsedData.treatment}</Text>
            <Text style={styles.dataRow}>Strength: {parsedData.colony_strength}</Text>
            <Text style={styles.dataRow}>Notes: {parsedData.notes}</Text>
          </View>
          <View style={styles.recordButtons}>
            <Button title="Back to Hive" onPress={() => setCurrentScreen('Hive')} />
            <Button title="Record Again" onPress={startRecord} color="#FF9800" />
          </View>
        </ScrollView>
      )}

      {/* Debug Panel at bottom */}
      <DebugPanel />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  testBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  card: { padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 18 },
  content: { padding: 20, flex: 1 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  sub: { fontSize: 16, color: '#666', marginBottom: 10 },
  buttonContainer: { marginTop: 20 },
  recordButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  uploadContainer: { marginTop: 30, alignItems: 'center' },
  audioText: { marginBottom: 10, color: '#333' },
  dataCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 20 },
  dataRow: { fontSize: 16, marginBottom: 5 },
  testButton: { marginTop: 20, borderTopWidth: 1, borderColor: '#eee', paddingTop: 20 },

  // Loading
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 100,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },

  // Debug panel
  debugContainer: {
    borderTopWidth: 2,
    borderColor: '#FF9800',
    backgroundColor: '#1a1a2e',
  },
  debugToggle: {
    padding: 10,
    backgroundColor: '#16213e',
    alignItems: 'center',
  },
  debugToggleText: { color: '#FFA000', fontWeight: 'bold', fontSize: 14 },
  debugContent: { maxHeight: 350, padding: 12 },
  debugSection: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#0f3460',
    borderRadius: 6,
  },
  debugLabel: { color: '#FFA000', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  debugValue: { fontSize: 14, fontWeight: '600' },
  debugMono: { color: '#e0e0e0', fontFamily: 'monospace', fontSize: 12, marginTop: 2 },
  debugInspectionRow: {
    borderTopWidth: 1,
    borderColor: '#1a1a4e',
    marginTop: 4,
    paddingTop: 4,
  },
});
