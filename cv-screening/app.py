# Baseline CV/JD text similarity service.
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Create the standalone API application; this module does not call the Node backend.
app = FastAPI(title="Trishakti CV Screening", version="0.1.0")


# Validate each identifier and its already-extracted CV text at the API boundary.
class CandidateText(BaseModel):
    # Bound identifier size independently of the submitted document.
    candidate_id: str = Field(min_length=1, max_length=100)
    # Limit text size; PDF/DOCX extraction must occur before this API is called.
    cv_text: str = Field(min_length=1, max_length=100_000)


# Require a job description and between one and 100 candidate documents.
class ScreeningRequest(BaseModel):
    # Use this document as the reference for every candidate comparison.
    job_description: str = Field(min_length=1, max_length=100_000)
    # Bound batch size to limit the work performed in one screening request.
    candidates: list[CandidateText] = Field(min_length=1, max_length=100)


# Associate each similarity measurement with its original candidate identifier.
class CandidateScore(BaseModel):
    candidate_id: str
    # Return similarity rather than a calibrated probability of hiring success.
    similarity_score: float


# Describe the scoring method and make the score interpretation explicit.
class ScreeningResponse(BaseModel):
    # Identify the algorithm so consuming interfaces can label the result correctly.
    scoring_method: str
    # Keep clients informed that the score is not a probability.
    scores_are_probabilities: bool
    # Return candidate-score pairs in ranking order.
    results: list[CandidateScore]


# Expose a lightweight health endpoint without processing any CV text.
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Validate input and serialize output with the declared response model.
@app.post("/screen", response_model=ScreeningResponse)
def screen_candidates(request: ScreeningRequest) -> ScreeningResponse:
    # Fit the job description and candidate texts in the same vocabulary.
    documents = [
        request.job_description,
        *(candidate.cv_text for candidate in request.candidates),
    ]
    # Calculate TF-IDF weights for this request; no pretrained model is loaded.
    vectors = TfidfVectorizer().fit_transform(documents)
    # Compare row zero (the job description) with the remaining CV rows.
    scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    # Pair scores with candidates and sort from highest similarity to lowest.
    ranked_candidates = sorted(
        zip(request.candidates, scores.tolist()),
        key=lambda candidate_and_score: candidate_and_score[1],
        reverse=True,
    )

    # Return identifiers and scores only; this function does not persist CV text.
    return ScreeningResponse(
        scoring_method="tfidf_cosine_similarity",
        scores_are_probabilities=False,
        results=[
            CandidateScore(
                candidate_id=candidate.candidate_id,
                similarity_score=score,
            )
            for candidate, score in ranked_candidates
        ],
    )
