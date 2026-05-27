import re
from difflib import get_close_matches
from decimal import Decimal, InvalidOperation

from django.db.models import Q

from .models import Brand, Category, Product


COLOR_WORDS = {
    "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
    "orange", "grey", "gray", "silver", "gold", "brown", "beige",
}


def normalize_query(query):
    return re.sub(r"\s+", " ", (query or "").strip()).lower()


def parse_smart_query(query):
    normalized = normalize_query(query)
    filters = {
        "brand": None,
        "category": None,
        "color": None,
        "minPrice": None,
        "maxPrice": None,
        "keywords": [],
    }
    if not normalized:
        return filters

    under_match = re.search(r"(?:under|below|less than|upto|up to)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)", normalized)
    if under_match:
        filters["maxPrice"] = _to_decimal(under_match.group(1))
        normalized = normalized.replace(under_match.group(0), " ")

    above_match = re.search(r"(?:above|over|more than)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)", normalized)
    if above_match:
        filters["minPrice"] = _to_decimal(above_match.group(1))
        normalized = normalized.replace(above_match.group(0), " ")

    range_match = re.search(r"(?:rs\.?|₹|inr)?\s*([\d,]+)\s*(?:-|to)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)", normalized)
    if range_match:
        filters["minPrice"] = _to_decimal(range_match.group(1))
        filters["maxPrice"] = _to_decimal(range_match.group(2))
        normalized = normalized.replace(range_match.group(0), " ")

    tokens = [token for token in re.split(r"[^a-z0-9]+", normalized) if token]
    brands = list(Brand.objects.values_list("name", flat=True))
    categories = list(Category.objects.values_list("name", flat=True))

    filters["brand"] = _find_named_match(normalized, tokens, brands)
    filters["category"] = _find_named_match(normalized, tokens, categories)
    filters["color"] = next((token for token in tokens if token in COLOR_WORDS), None)

    consumed = set()
    for value in (filters["brand"], filters["category"], filters["color"]):
        if value:
            consumed.update(str(value).lower().split())

    filters["keywords"] = [
        token for token in tokens
        if token not in consumed and token not in {"with", "for", "and", "the", "a", "an"}
    ]
    return filters


def apply_smart_filters(queryset, filters):
    if filters.get("brand"):
        queryset = queryset.filter(brand__name__iexact=filters["brand"])
    if filters.get("category"):
        queryset = queryset.filter(category__name__iexact=filters["category"])
    if filters.get("minPrice") is not None:
        queryset = queryset.filter(price__gte=filters["minPrice"])
    if filters.get("maxPrice") is not None:
        queryset = queryset.filter(price__lte=filters["maxPrice"])
    if filters.get("color"):
        queryset = queryset.filter(
            Q(options__option__name__iexact="color", options__value__iexact=filters["color"])
            | Q(name__icontains=filters["color"])
            | Q(description__icontains=filters["color"])
        )
    for keyword in filters.get("keywords", []):
        queryset = queryset.filter(
            Q(name__icontains=keyword)
            | Q(description__icontains=keyword)
            | Q(brand__name__icontains=keyword)
            | Q(category__name__icontains=keyword)
            | Q(features__icontains=keyword)
        )
    return queryset.distinct()


def get_typo_suggestion(query):
    normalized = normalize_query(query)
    if len(normalized) < 3:
        return None
    candidates = set(Product.objects.values_list("name", flat=True))
    candidates.update(Brand.objects.values_list("name", flat=True))
    candidates.update(Category.objects.values_list("name", flat=True))
    matches = get_close_matches(normalized, [c for c in candidates if c], n=1, cutoff=0.78)
    return matches[0] if matches else None


def _find_named_match(normalized, tokens, values):
    for value in sorted([v for v in values if v], key=len, reverse=True):
        value_norm = normalize_query(value)
        if value_norm and re.search(rf"\b{re.escape(value_norm)}\b", normalized):
            return value
    token_set = set(tokens)
    return next((value for value in values if normalize_query(value) in token_set), None)


def _to_decimal(value):
    try:
        return Decimal(str(value).replace(",", ""))
    except (InvalidOperation, TypeError):
        return None
