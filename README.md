# Synx - Music Learning App (In Development)

### A web application that analyzes audio files to extract chords and generate instrument tabs for learning.

![View Synx Live.](https://www.synx.studio)

![Synx Demonstration](SynxGif.gif)

## Features

**Audio Upload**: Upload MP3/WAV files of songs

**Automatic Chord Detection**: Uses librosa to analyze audio and detect chords over time

**Tab Generation**: Converts detected chords to guitar and ukulele tabs

**Auto-Analysis**: Songs are automatically analyzed upon upload

## Tech Stack
**Frontend**:

React + Vite + TailwindCSS

Axios for API calls

**Backend**:

Django + Django REST Framework

PostgreSQL database

Librosa for audio processing

# Setup

## Prerequisites

Install the following:

- Python 3.x
- Node.js (LTS recommended)
- PostgreSQL
- Git

Verify the installations:

```bash
python --version
pip --version
node -v
npm -v
psql --version
git --version
```

## 1. Clone the Repository

Make sure to be in the directory you want the repository to be in before cloning

```bash
git clone https://github.com/carlog1566/Synx
cd Synx
```

## 2. Backend Setup

Navigate to the `backend` folder.

```bash
cd backend
```

### Create a Virtual Environment

Windows

```cmd
python -m venv env
```

macOS

```bash
python3 -m venv env
```

### Activate the Virtual Environment

Windows (Command Prompt)

```cmd
env\Scripts\activate
```

Windows (PowerShell)

```powershell
env\Scripts\Activate.ps1
```

macOS

```bash
source env/bin/activate
```

### Install Backend Dependencies

Windows

```cmd
pip install -r requirements.txt
```

macOS

```bash
pip3 install -r requirements.txt
```

## 3. Backend Environment Variables

Inside the `backend` directory, create a `.env` file.

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=synx_db
DB_USER=synx_user
DB_PASSWORD=your-db-password-here
DB_HOST=localhost
DB_PORT=5432
```

To generate a secret key:

Windows

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

macOS

```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 4. PostgreSQL Setup

Open a new terminal and open PostgreSQL.

Windows

```cmd
psql -U postgres
```

macOS

```bash
psql postgres
```

Then run:

```sql
CREATE ROLE synx_user WITH LOGIN PASSWORD 'your-password-here';
CREATE DATABASE synx_db OWNER synx_user;

\c synx_db

ALTER SCHEMA public OWNER TO synx_user;
GRANT ALL ON SCHEMA public TO synx_user;
GRANT CREATE ON SCHEMA public TO synx_user;
```

## 5. Run Migrations

Windows

```bash
python manage.py makemigrations
python manage.py migrate
```

macOS

```bash
python3 manage.py makemigrations
python3 manage.py migrate
```

## 6. Create Admin User (Optional)

Windows:

```bash
python manage.py createsuperuser
```

macOS:

```bash
python3 manage.py createsuperuser
```

## 7. Start Django Server

Windows
```bash
python manage.py runserver
```

macOS
```bash
python3 manage.py runserver
```

Backend runs at: `http://localhost:8000`

## 8. Frontend Setup

Open a new terminal

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Start the frontend
```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`


# Usage

1) Fill out the song form (title, artist, audio file)
2) Click "Add Song"
3) Song automatically analyzes in background
4) View detected chords and tabs once analysis completes

# Project Status
**Currently implementing**:

* [x] Audio file upload
* [x] Chord detection
* [x] Auto-analysis on upload
* [x] Tab generation
* [x] Interactive tab player
* [x] Deployment
* [ ] User authentication (in progress)
* [ ] Song recommendations (planned)
* [ ] Improve tab generation (planned)
* [ ] Computer Vision Tracking?
