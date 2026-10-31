# Behavioral checks for the baseline ranking service.
import unittest

from app import ScreeningRequest, screen_candidates


# Compare a deliberately matching CV with an unrelated fictional CV.
class ScreeningTests(unittest.TestCase):
    # Check ranking order, score separation, and the non-probability indicator.
    def test_ranks_more_similar_candidate_first(self) -> None:
        # Use synthetic text fixtures rather than personal candidate information.
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

        # Call the scoring function directly without running an HTTP server.
        response = screen_candidates(request)

        # The matching candidate must rank first regardless of input order.
        self.assertEqual(
            [result.candidate_id for result in response.results],
            ["more-relevant", "less-relevant"],
        )
        # The relevant CV should score higher than the unrelated text.
        self.assertGreater(
            response.results[0].similarity_score,
            response.results[1].similarity_score,
        )
        # Verify that similarity is not advertised as a probability.
        self.assertFalse(response.scores_are_probabilities)


# Support running this test file directly as well as through discovery.
if __name__ == "__main__":
    unittest.main()
