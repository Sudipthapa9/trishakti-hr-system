import unittest

from app import ScreeningRequest, screen_candidates


class ScreeningTests(unittest.TestCase):
    def test_ranks_more_similar_candidate_first(self) -> None:
        request = ScreeningRequest(
            job_description="Python developer with SQL database experience",
            candidates=[
                {
                    "candidate_id": "less-relevant",
                    "cv_text": "Experienced graphic designer and illustrator",
                },
                {
                    "candidate_id": "more-relevant",
                    "cv_text": "Python developer with SQL database experience",
                },
            ],
        )

        response = screen_candidates(request)

        self.assertEqual(
            [result.candidate_id for result in response.results],
            ["more-relevant", "less-relevant"],
        )
        self.assertGreater(
            response.results[0].similarity_score,
            response.results[1].similarity_score,
        )
        self.assertFalse(response.scores_are_probabilities)


if __name__ == "__main__":
    unittest.main()
