# CV Screening AI Work

## What we built

Created a standalone Python service in `cv-screening/` for ranking candidate CV
text against a job description. The service uses scikit-learn's
`TfidfVectorizer` and cosine similarity.

TF-IDF and cosine similarity are calculated when a screening request is
processed; there is no pretrained model file to import or train. The service
accepts already-extracted text. It does not yet extract text from PDF or DOCX
files, persist results, or make hiring decisions.

## Service files

- `cv-screening/app.py` defines the FastAPI application and screening API.
- `cv-screening/requirements.txt` lists FastAPI, scikit-learn, and Uvicorn.
- `cv-screening/Dockerfile` builds a container image for the service.
- `cv-screening/tests/test_app.py` checks that the more relevant CV ranks
  higher.
- `cv-screening/README.md` documents local setup, Compose usage, and the API.

## API

- `GET /health` returns `{"status":"ok"}` when the service is available.
- `POST /screen` accepts a job description and a list of candidates, each with
  a candidate ID and extracted CV text.
- The response ranks candidates by similarity and includes a
  `similarity_score` from 0 to 1.
- Scores are text-similarity measurements, not probabilities or hiring
  recommendations.
- The service processes submitted text in memory and does not store or log it.

## Running the service

For local development, create and activate a Python virtual environment in
`cv-screening/`, install `requirements.txt`, and run:

```powershell
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The API documentation is available at `http://127.0.0.1:8000/docs`.

From the repository root, the Docker Compose service can be started with:

```powershell
docker compose up --build cv-screening
```

The Compose configuration publishes the service on localhost port 8000. Other
Compose services can address it as `http://cv-screening:8000`.

## Project integration changes

- Added the `cv-screening` service to the root `docker-compose.yml`.
- Updated `.gitignore` Python cache comments and model-cache paths for
  `cv-screening/`.

## Verification completed

- Installed the service requirements in the local Python environment.
- The unit test passed: the more relevant CV ranked ahead of a less relevant
  CV.
- Started the API locally and verified `/health` and `/screen` with a live
  request. The matching candidate ranked first.
- `docker compose config -q` passed.
- `git diff --check` passed.
- The Docker image build could not be verified because Docker Desktop's Linux
  engine was unavailable.

## Remaining work

- Extract text safely from uploaded PDF and DOCX CVs.
- Connect the Node.js backend to the screening service and protect that
  service-to-service integration.
- Store screening results and show scores and reasons in the HR interface.
- Add required-skill checks and configurable business weighting, then test the
  ranking policy with reviewed examples.
- Keep HR responsible for final hiring decisions and review privacy and
  fairness before using real candidate data.
