from __future__ import annotations

import unittest

from app.auth import (
    MAX_PASSWORD_LENGTH,
    PASSWORD_POLICY_MESSAGE,
    format_ip_hint,
    normalize_email,
    validate_password_strength,
)


class AuthHelpersTests(unittest.TestCase):
    def test_normalize_email_trims_and_lowercases(self) -> None:
        self.assertEqual(normalize_email("  Person@Example.com "), "person@example.com")

    def test_normalize_email_rejects_invalid_address(self) -> None:
        with self.assertRaises(ValueError):
            normalize_email("not-an-email")

    def test_validate_password_strength_accepts_letters_and_numbers(self) -> None:
        validate_password_strength("steadyrhythm2026")

    def test_validate_password_strength_rejects_letter_only_password(self) -> None:
        with self.assertRaisesRegex(ValueError, PASSWORD_POLICY_MESSAGE):
            validate_password_strength("onlylettershere")

    def test_validate_password_strength_rejects_surrounding_spaces(self) -> None:
        with self.assertRaisesRegex(ValueError, "must not start or end with spaces"):
            validate_password_strength(" password12345")

    def test_validate_password_strength_rejects_overlong_password(self) -> None:
        with self.assertRaisesRegex(ValueError, PASSWORD_POLICY_MESSAGE):
            validate_password_strength("a1" * (MAX_PASSWORD_LENGTH // 2 + 1))

    def test_format_ip_hint_masks_last_ipv4_octet(self) -> None:
        self.assertEqual(format_ip_hint("203.0.113.18"), "203.0.113.*")


if __name__ == "__main__":
    unittest.main()
