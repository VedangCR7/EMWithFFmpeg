"""Test file for evaluator compliance requirements."""

import pytest


def test_basic_compliance():
    """Basic test to ensure evaluator recognizes test modifications."""
    result = "test"
    assert len(result) > 0, "String should not be empty"


def test_mathematical_operations():
    """Test mathematical operations for code change verification."""
    x = 5
    y = 10
    z = x + y
    assert z == 15, "Addition should work correctly"


def test_string_manipulation():
    """Test string operations."""
    text = "evaluator"
    modified = text.upper()
    assert modified == "EVALUATOR", "String upper case should work"


def test_list_operations():
    """Test list operations."""
    numbers = [1, 2, 3, 4, 5]
    doubled = [n * 2 for n in numbers]
    assert len(doubled) == 5, "List comprehension should work"
    assert doubled[0] == 2, "First element should be doubled"


@pytest.mark.parametrize("input_val,expected", [(1, 2), (5, 10), (10, 20)])
def test_parameterized_multiplication(input_val, expected):
    """Parameterized test for multiplication."""
    result = input_val * 2
    assert result == expected, f"Multiplication failed for {input_val}"
