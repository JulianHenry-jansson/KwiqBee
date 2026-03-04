# BiKoll MVP -- Claude Code Build Instructions

## Overview

Build a working MVP for **BiKoll**, an AI-powered beekeeping inspection
system.

The goal is to test a complete end-to-end pipeline:

1.  iPhone records a voice note (Expo Go).
2.  Audio is sent to an AI server running on a GPU.
3.  Whisper transcribes the speech.
4.  Qwen converts the transcript into structured JSON.
5.  The mobile app saves the result in **Supabase**.
6.  A **Next.js web dashboard** reads from Supabase and displays the
    inspection in the correct hive.

This project is a **technical proof-of-concept**.

------------------------------------------------------------------------

# System Architecture

    iPhone (Expo Go)
          ↓
    React Native App
          ↓
    POST audio
          ↓
    GPU server (Vast.ai)
    FastAPI
          ↓
    Whisper
          ↓
    Qwen
          ↓
    Structured JSON
          ↓
    Supabase PostgreSQL
          ↓
    Next.js dashboard

The AI server runs on a GPU hosted through Vast.ai.

Server stack:

-   FastAPI
-   Whisper
-   Qwen via Ollama
-   RTX 3090 GPU

------------------------------------------------------------------------

# Monorepo Structure

    bikoll/

    apps/
       mobile/
       web/

    packages/
       shared/

    supabase/
       migrations/

    README.md

Use **pnpm workspaces** if possible.

------------------------------------------------------------------------

# Supabase Setup

Install Supabase client:

    @supabase/supabase-js

Use it in both mobile and web apps.

------------------------------------------------------------------------

# Environment Variables

## Mobile `.env`

    EXPO_PUBLIC_SUPABASE_URL=
    EXPO_PUBLIC_SUPABASE_ANON_KEY=
    EXPO_PUBLIC_API_BASE_URL=

## Web `.env.local`

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=

------------------------------------------------------------------------

# Supabase Database Schema

Create migrations inside:

    /supabase/migrations

## apiaries

    id uuid primary key
    user_id uuid
    name text
    created_at timestamp

## hives

    id uuid primary key
    apiary_id uuid
    name text
    created_at timestamp

## inspections

    id uuid primary key
    hive_id uuid
    user_id uuid

    queen_seen boolean
    queen_color text
    brood_frames integer
    colony_strength text
    treatment text
    notes text

    transcript text
    audio_url text

    created_at timestamp

------------------------------------------------------------------------

# Supabase Storage

Create storage bucket:

    inspection-audio

Structure:

    inspection-audio/
       user_id/
          inspection_id.m4a

------------------------------------------------------------------------

# Row Level Security

Enable RLS.

Policy:

    auth.uid() = user_id

Users can only access their own inspections.

------------------------------------------------------------------------

# Shared Types

Location:

    /packages/shared

Install:

    zod

Create type:

    HiveInspection

Schema:

    {
     queen_seen: boolean
     queen_color: string | null
     brood_frames: number | null
     treatment: string | null
     colony_strength: string | null
     notes: string
    }

Create function:

    parseInspectionResponse()

It must support backend responses in multiple formats.

Case 1:

    { result: "{...json string...}" }

Case 2:

    { result: {...json object...} }

Case 3:

    {...json object...}

Return a validated `HiveInspection`.

------------------------------------------------------------------------

# Mobile App (Expo)

Create Expo app in:

    apps/mobile

Install:

    expo-av
    expo-file-system
    @react-native-async-storage/async-storage
    @supabase/supabase-js

------------------------------------------------------------------------

# Mobile Screens

## Home Screen

Display hives:

    Bikupa 1
    Bikupa 2
    Bikupa 3

Data loaded from Supabase.

------------------------------------------------------------------------

## Hive Screen

When user taps:

    Bikupa 1

Show:

-   latest inspection
-   inspection history

Data comes from Supabase.

------------------------------------------------------------------------

## Record Inspection Screen

Large buttons:

    Start recording
    Stop
    Upload

Use `expo-av`.

------------------------------------------------------------------------

# Upload Flow

1.  Record `.m4a` audio.

2.  Upload to Supabase Storage.

```{=html}
<!-- -->
```
    supabase.storage
       .from("inspection-audio")
       .upload(path, file)

3.  Retrieve `audio_url`.

4.  Send audio to AI server.

```{=html}
<!-- -->
```
    POST /transcribe

Multipart form:

    file

------------------------------------------------------------------------

# AI Server

The AI server runs on a GPU hosted via Vast.ai.

Start command:

    uvicorn api.server:app --host 0.0.0.0 --port 8000

Endpoint:

    POST /transcribe

Input:

    audio file

Output:

    {
     result: {...structured JSON...}
    }

or

    {
     result: "{...json string...}"
    }

------------------------------------------------------------------------

# Confirm Screen

Display parsed inspection:

    Queen seen
    Queen color
    Brood frames
    Treatment
    Strength
    Notes

Buttons:

    Save inspection
    Record again

------------------------------------------------------------------------

# Save Inspection

Insert into Supabase:

    supabase
     .from("inspections")
     .insert({
       hive_id,
       user_id,
       queen_seen,
       queen_color,
       brood_frames,
       treatment,
       colony_strength,
       notes,
       transcript,
       audio_url
     })

------------------------------------------------------------------------

# Web App (Next.js)

Create web app in:

    apps/web

Install:

    @supabase/supabase-js
    tailwindcss

------------------------------------------------------------------------

# Dashboard Page

Show apiaries:

    Bigård A

Under each apiary:

    Bikupa 1
    Bikupa 2
    Bikupa 3

Data from Supabase.

------------------------------------------------------------------------

# Hive Page

Route:

    /hives/[id]

Example:

    Bikupa 1

------------------------------------------------------------------------

# Latest Inspection Card

Display fields:

    Queen seen
    Queen color
    Brood frames
    Treatment
    Colony strength
    Notes
