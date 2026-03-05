# Synx - Music Learning App

### A web application that analyzes audio files to extract chords and generate instrument tabs for learning.

## Features

**Audio Upload**: Upload MP3/WAV files of songs

**Automatic Chord Detection**: Uses librosa to analyze audio and detect chords over time

**Tab Generation**: Converts detected chords to guitar and ukulele tabs

**Auto-Analysis**: Songs are automatically analyzed upon upload

## Tech Stack
**Frontend**:

React + Vite
Axios for API calls

**Backend**:

Django + Django REST Framework

PostgreSQL database

Librosa for audio processing

## Setup
**Backend**
```
cd backend
python -m venv venv
source env/bin/activate  # Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
**Frontend**
```
bashcd frontend
npm install
npm run dev
```

## Usage

1) Fill out the song form (title, artist, audio file)
2) Click "Add Song"
3) Song automatically analyzes in background
4) View detected chords and tabs once analysis completes

## Project Status
**Currently implementing**:

* [x] Audio file upload
* [x] Chord detection
* [x] Auto-analysis on upload
* [ ] Tab generation (in progress)
* [ ] Interactive tab player (planned)
* [ ] User authentication (planned)
* [ ] Song recommendations (planned)
* [ ] Computer Vision Tracking?
