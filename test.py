import requests

files = {"file": open("test.wav.m4a", "rb")}

r = requests.post(
    "http://localhost:8000/transcribe",
    files=files
)

print(r.json())