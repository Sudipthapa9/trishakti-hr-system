# CV Screening Service

This standalone Python service ranks **already-extracted CV text** against a
job description using TF-IDF and cosine similarity. It does not load a
pre-trained model, extract text from PDF/DOCX files, or make hiring decisions.

## Run locally

From this folder, create and activate a virtual environment, then install the
dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. Interactive API documentation
is at `http://127.0.0.1:8000/docs`.

## Run with Docker Compose

From the repository root:

```powershell
docker compose up --build cv-screening
```

The service is published only on localhost at `http://127.0.0.1:8000`.
Other services on the Compose network can reach it at
`http://cv-screening:8000`.

## Screen candidates

Send extracted text to `POST /screen`:

```json
{
  "job_description": "Seeking a Python developer with SQL experience.",
  "candidates": [
    {
      "candidate_id": "candidate-001",
      "cv_text": "Software developer with Python and SQL experience."
    },
    {
      "candidate_id": "candidate-002",
      "cv_text": "Experienced graphic designer."
    }
  ]
}
```

Each result contains a similarity score from `0` to `1` and is ordered from
highest to lowest. A score is **not** a probability or a hiring recommendation.
The service processes submitted CV text in memory and does not store or log it.
Use only approved data and keep a human reviewer responsible for hiring
decisions.
