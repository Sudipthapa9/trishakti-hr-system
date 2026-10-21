from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


app = FastAPI(title="Trishakti CV Screening", version="0.1.0")


class CandidateText(BaseModel):
    candidate_id: str = Field(min_length=1, max_length=100)
    cv_text: str = Field(min_length=1, max_length=100_000)


class ScreeningRequest(BaseModel):
    job_description: str = Field(min_length=1, max_length=100_000)
    candidates: list[CandidateText] = Field(min_length=1, max_length=100)


class CandidateScore(BaseModel):
    candidate_id: str
    similarity_score: float


class ScreeningResponse(BaseModel):
    scoring_method: str
    scores_are_probabilities: bool
    results: list[CandidateScore]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/screen", response_model=ScreeningResponse)
def screen_candidates(request: ScreeningRequest) -> ScreeningResponse:
    documents = [
        request.job_description,
        *(candidate.cv_text for candidate in request.candidates),
    ]
    vectors = TfidfVectorizer().fit_transform(documents)
    scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    ranked_candidates = sorted(
        zip(request.candidates, scores.tolist()),
        key=lambda candidate_and_score: candidate_and_score[1],
        reverse=True,
    )

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
