import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useNavigate } from "react-router-dom";
import { fetchSearchHistory, fetchSuggestions, fetchTrendingSearches, recordSearch } from "../../services/searchService";

const highlightMatch = (text = "", query = "") => {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <Box component="mark" sx={{ bgcolor: "warning.light", color: "inherit", px: 0.25, borderRadius: 0.5 }}>
        {text.slice(index, index + query.length)}
      </Box>
      {text.slice(index + query.length)}
    </>
  );
};

const LiveSearchBox = ({ autoFocus = false, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [didYouMean, setDidYouMean] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const abortRef = useRef(null);

  useEffect(() => {
    fetchSearchHistory().then(setHistory);
    fetchTrendingSearches().then(setTrending).catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setDidYouMean(null);
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      fetchSuggestions(query, abortRef.current.signal)
        .then((data) => {
          setSuggestions(data?.suggestions || []);
          setDidYouMean(data?.didYouMean || null);
          setActiveIndex(-1);
        })
        .catch((error) => {
          if (error.name !== "CanceledError") setSuggestions([]);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fallbackRows = useMemo(() => {
    if (query.trim()) return [];
    return [
      ...history.slice(0, 5).map((term) => ({ type: "history", label: term })),
      ...trending.slice(0, 5).map((term) => ({ type: "trending", label: term })),
    ];
  }, [history, query, trending]);

  const rows = query.trim()
    ? suggestions.map((product) => ({ type: "product", product, label: product.name }))
    : fallbackRows;

  const submitSearch = async (value = query) => {
    const term = value?.trim();
    if (!term) return;
    await recordSearch(term);
    setOpen(false);
    onNavigate?.();
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const selectRow = (row) => {
    if (!row) return;
    if (row.type === "product") {
      recordSearch(row.product.name);
      setOpen(false);
      onNavigate?.();
      navigate(`/product/${row.product.id}`);
      return;
    }
    submitSearch(row.label);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      activeIndex >= 0 ? selectRow(rows[activeIndex]) : submitSearch();
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        autoFocus={autoFocus}
        placeholder="Search for products..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: loading ? <CircularProgress size={18} /> : null,
        }}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "20px" } }}
      />

      {open && (rows.length > 0 || didYouMean) && (
        <Paper elevation={6} sx={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1600, overflow: "hidden" }}>
          {didYouMean && query.trim() && (
            <ListItemButton onMouseDown={(event) => event.preventDefault()} onClick={() => submitSearch(didYouMean)}>
              <ListItemText primary={<>Did you mean <strong>{didYouMean}</strong>?</>} />
            </ListItemButton>
          )}
          <List dense disablePadding>
            {rows.slice(0, 10).map((row, index) => (
              <ListItemButton
                key={`${row.type}-${row.product?.id || row.label}`}
                selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectRow(row)}
              >
                {row.type === "history" ? <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> : null}
                {row.type === "trending" ? <TrendingUpIcon fontSize="small" sx={{ mr: 1 }} /> : null}
                <ListItemText
                  primary={highlightMatch(row.label, query)}
                  secondary={row.product ? [row.product.brand, row.product.category].filter(Boolean).join(" • ") : row.type === "history" ? "Recent search" : "Trending"}
                />
              </ListItemButton>
            ))}
          </List>
          {loading && (
            <Typography variant="caption" sx={{ display: "block", px: 2, py: 1 }}>
              Searching...
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default LiveSearchBox;
