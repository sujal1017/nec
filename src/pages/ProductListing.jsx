// ProductListing.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	Box,
	Typography,
	CircularProgress,
	Checkbox,
	FormControlLabel,
	Slider,
	Button,
	Chip,
	Stack,
	IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme, useMediaQuery } from "@mui/material";
import { BaseUrl } from "../config";

const DEFAULT_LIMIT = 20;
const MAX_PRICE = 200000;
const API_BASE_URL = BaseUrl; // Use from config.js

const INITIAL_FILTERS = {
	categories: [],
	brands: [],
	minPrice: 0,
	maxPrice: MAX_PRICE,
	rating: 0,
	availability: null,
	color: [],
	storage: [],
	size: [],
	volume: [],
};

const ProductListing = ({ darkMode, setDarkMode }) => {
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === "dark";
	const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
	
	// React Router hooks - must be declared early
	const location = useLocation();
	const navigate = useNavigate();

	// Helper function to convert text to title case for display
	const toTitleCase = (str) => {
		return str.replace(/\w\S*/g, (txt) => 
			txt.charAt(0).toUpperCase() + txt.substr(1)
		);
	};

	// Helper function to update URL with current filters
	const updateURL = useCallback((filters) => {
		const queryParts = [];
		
		// Add categories to URL
		if (filters.categories && filters.categories.length > 0) {
			queryParts.push(`category=${filters.categories.join(',')}`);
		}
		
		// Add brands to URL
		if (filters.brands && filters.brands.length > 0) {
			queryParts.push(`brands=${filters.brands.join(',')}`);
		}
		
		// Add price range if not default
		if (filters.minPrice > 0) {
			queryParts.push(`minPrice=${filters.minPrice}`);
		}
		if (filters.maxPrice < MAX_PRICE) {
			queryParts.push(`maxPrice=${filters.maxPrice}`);
		}
		
		// Add rating if set
		if (filters.rating > 0) {
			queryParts.push(`rating=${filters.rating}`);
		}
		
		// Add availability if set
		if (filters.availability === true) {
			queryParts.push(`inStock=true`);
		}
		
		// Add dynamic options
		Object.entries(filters).forEach(([key, value]) => {
			if (['categories', 'brands', 'minPrice', 'maxPrice', 'rating', 'availability'].includes(key)) {
				return; // Skip already handled
			}
			if (Array.isArray(value) && value.length > 0) {
				queryParts.push(`${key}=${value.join(',')}`);
			}
		});
		
		const newSearch = queryParts.length > 0 ? queryParts.join('&') : '';
		const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
		
		// Only navigate if URL actually changed
		if (newPath !== `${location.pathname}${location.search}`) {
			navigate(newPath, { replace: true });
		}
	}, [location.pathname, location.search, navigate]);

	// Helper function to sync filters with URL when filters change
	const syncFiltersWithURL = useCallback((newFilters) => {
		setFilters(newFilters);
		setAppliedFilters(newFilters);
		updateURL(newFilters);
	}, [updateURL]);

	// Helper function to parse URL parameters into filters
	const parseURLToFilters = useCallback(() => {
		const params = new URLSearchParams(location.search);
		const filters = { ...INITIAL_FILTERS };
		
		// Parse categories
		const categoryParam = params.get('category');
		if (categoryParam) {
			filters.categories = categoryParam.split(',').filter(Boolean);
		}
		
		// Parse brands
		const brandsParam = params.get('brands');
		if (brandsParam) {
			filters.brands = brandsParam.split(',').filter(Boolean);
		}
		
		// Parse price range
		const minPrice = params.get('minPrice');
		if (minPrice) {
			filters.minPrice = parseInt(minPrice, 10) || 0;
		}
		
		const maxPrice = params.get('maxPrice');
		if (maxPrice) {
			filters.maxPrice = parseInt(maxPrice, 10) || MAX_PRICE;
		}
		
		// Parse rating
		const rating = params.get('rating');
		if (rating) {
			filters.rating = parseInt(rating, 10) || 0;
		}
		
		// Parse availability
		const inStock = params.get('inStock');
		if (inStock === 'true') {
			filters.availability = true;
		}
		
		// Parse dynamic options
		params.forEach((value, key) => {
			if (!['category', 'brands', 'minPrice', 'maxPrice', 'rating', 'inStock'].includes(key)) {
				filters[key] = value.split(',').filter(Boolean);
			}
		});
		
		return filters;
	}, [location.search]);
	// UI / data states
	const [products, setProducts] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true); // Start with loading true
	const [error, setError] = useState(null);
	const [hasInitialLoad, setHasInitialLoad] = useState(false);

	// pagination
	const [offset, setOffset] = useState(0);
	const [limit] = useState(DEFAULT_LIMIT);

	// filter state (mutable by UI)
	const [filters, setFilters] = useState(INITIAL_FILTERS);

	// list of possible options (derived)
	const [options, setOptions] = useState({
		categories: [],
		brands: [],
		dynamic: {}, // { optionName: [values] }
	});

	// drawer
	const [drawerOpen, setDrawerOpen] = useState(false);

	// used to remember which filters are applied (for chips)
	const [appliedFilters, setAppliedFilters] = useState(null);

	// ---------- Utility: derive filter option lists from raw product array ----------
	const deriveOptions = useCallback((items = []) => {
		const categoriesSet = new Set();
		const brandsSet = new Set();
		const dynamicSets = {}; // { key: Set(values) }

		items.forEach((p) => {
			if (p && p.category) categoriesSet.add(p.category);
			if (p && p.brand) brandsSet.add(p.brand);
			if (p && p.options && typeof p.options === "object") {
				Object.entries(p.options).forEach(([key, vals]) => {
					if (!Array.isArray(vals)) return;
					if (!dynamicSets[key]) dynamicSets[key] = new Set();
					vals.forEach((v) => dynamicSets[key].add(v));
				});
			}
		});

		// Merge with existing options so values never disappear after filtering
		setOptions((prev) => {
			const mergedCategories = new Set(prev.categories ?? []);
			Array.from(categoriesSet).forEach((c) => mergedCategories.add(c));

			const mergedBrands = new Set(prev.brands ?? []);
			Array.from(brandsSet).forEach((b) => mergedBrands.add(b));

			const mergedDynamic = { ...(prev.dynamic || {}) };
			Object.entries(dynamicSets).forEach(([k, setVals]) => {
				const existing = new Set(mergedDynamic[k] ?? []);
				Array.from(setVals).forEach((v) => existing.add(v));
				mergedDynamic[k] = Array.from(existing).sort();
			});

			return {
				categories: Array.from(mergedCategories).sort(),
				brands: Array.from(mergedBrands).sort(),
				dynamic: mergedDynamic,
			};
		});
	}, []);



	// ---------- Convert filter body -> json-server friendly query params ----------
	// new
	const buildBackendParams = (body = {}) => {
		const params = {};
		if (Array.isArray(body.categories) && body.categories.length)
			params.category = body.categories.join(",");
		if (Array.isArray(body.brands) && body.brands.length)
			params.brand = body.brands.join(",");
		if (typeof body.minPrice === "number" && body.minPrice > 0)
			params.min_price = body.minPrice;
		if (typeof body.maxPrice === "number" && body.maxPrice < MAX_PRICE)
			params.max_price = body.maxPrice;
		if (body.rating && typeof body.rating === "number")
			params.rating = body.rating;
		if (body.availability === true) params.in_stock = "true";

		// dynamic option_* params for any array keys not in base filter keys
		const baseKeys = new Set([
			"categories",
			"brands",
			"minPrice",
			"maxPrice",
			"rating",
			"availability",
			"offset",
			"limit",
		]);
		Object.entries(body).forEach(([key, val]) => {
			if (baseKeys.has(key)) return;
			if (Array.isArray(val) && val.length) {
				params[`option_${key}`] = val.join(",");
			}
		});

		return params;
	};

	// ---------- Main: perform filtered request ----------
	const performFilterRequest = async (body = {}, append = false) => {
		if (!append) {
			setLoading(true);
		}
		setError(null);

		try {
			// Merge defaults for pagination since backend doesn't paginate
			const usedBody = {
				minPrice: 0,
				maxPrice: MAX_PRICE,
				offset: 0,
				limit,
				...body,
			};
			
			// build params from provided body
			const params = buildBackendParams(usedBody);

			// call Django API
			const resp = await axios.get(`${BaseUrl}/products/`, {
				params
			});

			// handle DRF plain or paginated responses
			const itemsAll = Array.isArray(resp.data)
				? resp.data
				: resp.data.results ?? resp.data.products ?? [];

			// client-side slice for pagination
			const start = usedBody.offset ?? 0;
			const lim = usedBody.limit ?? limit;
			const slice = itemsAll.slice(start, start + lim);

			// fetch detailed options for each product to display option values
			const withOptions = await Promise.all(
				slice.map(async (prod) => {
					try {
						const detail = await axios.get(`${API_BASE_URL}/products/${prod.id}/`, {
							timeout: 5000
						});
						const data = detail.data || {};
						return { ...prod, options: data.options ?? prod.options };
					} catch (_) {
						return prod;
					}
				})
			);

			setProducts((prev) => (append ? [...prev, ...withOptions] : withOptions));
			// update available filter options by merging from current batch
			deriveOptions(append ? [...products, ...withOptions] : withOptions);
			setTotal(resp.data.count ?? itemsAll.length);
			setHasInitialLoad(true);
		} catch (err) {
			console.error("Backend fetch failed", err);
			setError("Failed to load products. Please check your connection and try again.");
			setHasInitialLoad(true);
		} finally {
			setLoading(false);
		}

	};

	// ---------- Initial: load filter options & initial fetch ----------
	useEffect(() => {
		const initializeData = async () => {
			let normalizedCategory = null;
			
			try {
				const resp = await axios.get(`${API_BASE_URL}/products/`, {
					timeout: 10000,
				});
				const all = Array.isArray(resp.data)
					? resp.data
					: resp.data.products ?? [];
				deriveOptions(all);

				// If URL has category param, normalize to actual category name
				const params = new URLSearchParams(location.search);
				const rawParam = params.get("category");
				if (rawParam) {
					const target = decodeURIComponent(rawParam).toLowerCase();
					const categoriesArr = Array.from(
						new Set(
							all
								.map((p) => p && p.category)
								.filter((c) => typeof c === "string" && c.length > 0)
						)
					);
					normalizedCategory =
						categoriesArr.find((c) => c.toLowerCase() === target) || rawParam;
				}
			} catch (error) {
				console.error("Failed to load initial data:", error);
			}

			// Parse all URL parameters into filters
			const urlFilters = parseURLToFilters();
			
			// If we have URL parameters, use them; otherwise use defaults
			const hasUrlParams = Object.keys(urlFilters).some(key => {
				const value = urlFilters[key];
				const defaultValue = INITIAL_FILTERS[key];
				return JSON.stringify(value) !== JSON.stringify(defaultValue);
			});

			if (hasUrlParams) {
				setFilters(urlFilters);
				setAppliedFilters(urlFilters);
				await performFilterRequest({ ...urlFilters, offset: 0, limit }, false);
			} else {
				await performFilterRequest({ offset: 0, limit }, false);
			}

			setOffset(0);
		};

		initializeData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.search]);

	// ---------- Handlers ----------
	const toggleArrayFilter = (key, value) => {
		setFilters((prev) => {
			const arr = Array.isArray(prev[key]) ? prev[key].slice() : [];
			const next = arr.includes(value)
				? arr.filter((v) => v !== value)
				: [...arr, value];
			return { ...prev, [key]: next };
		});
	};

	const handlePriceChange = (e, newVal) => {
		setFilters((prev) => ({
			...prev,
			minPrice: newVal[0],
			maxPrice: newVal[1],
		}));
	};

	const handleRatingChange = (value) => {
		setFilters((prev) => ({ ...prev, rating: value }));
	};

	const toggleAvailability = () => {
		setFilters((prev) => ({
			...prev,
			availability: prev.availability === true ? null : true,
		}));
	};

	const applyFilters = async () => {
		// set pagination back to 0
		setOffset(0);
		const body = {
			offset: 0,
			limit,
			categories: filters.categories,
			brands: filters.brands,
			minPrice: filters.minPrice,
			maxPrice: filters.maxPrice,
			rating: filters.rating,
			availability: filters.availability,
			color: filters.color,
			storage: filters.storage,
			size: filters.size,
			volume: filters.volume,
		};
		
		// Sync filters with URL
		syncFiltersWithURL(filters);
		
		setDrawerOpen(false);
		await performFilterRequest(body, false);
	};

	const clearFilters = async () => {
		setFilters(INITIAL_FILTERS);
		setAppliedFilters(null);
		setOffset(0);
		
		// Clear URL parameters
		navigate(location.pathname, { replace: true });
		
		await performFilterRequest({ offset: 0, limit }, false);
		setDrawerOpen(false);
	};

	const loadMore = async () => {
		if (loading) return; // Prevent multiple simultaneous requests
		
		const nextOffset = offset + limit;
		setOffset(nextOffset);

		// If we have appliedFilters use them, else send empty (but include offset/limit)
		const base = appliedFilters
			? { ...appliedFilters, offset: nextOffset, limit }
			: { offset: nextOffset, limit };

		await performFilterRequest(base, true);
	};

	const removeChip = async (type, value) => {
		// Update filters state
		const updatedFilters = {
			...filters,
			[type]: Array.isArray(filters[type])
				? filters[type].filter((v) => v !== value)
				: filters[type]
		};
		setFilters(updatedFilters);

		// build a new body from current applied filters while removing only the specific value
		const nextApplied = {
			offset: 0,
			limit,
			categories: Array.isArray(appliedFilters?.categories)
				? (type === "categories"
					? appliedFilters.categories.filter((v) => v !== value)
					: appliedFilters.categories)
				: [],
			brands: Array.isArray(appliedFilters?.brands)
				? (type === "brands"
					? appliedFilters.brands.filter((v) => v !== value)
					: appliedFilters.brands)
				: [],
			color: Array.isArray(appliedFilters?.color)
				? (type === "color"
					? appliedFilters.color.filter((v) => v !== value)
					: appliedFilters.color)
				: [],
			storage: Array.isArray(appliedFilters?.storage)
				? (type === "storage"
					? appliedFilters.storage.filter((v) => v !== value)
					: appliedFilters.storage)
				: [],
			size: Array.isArray(appliedFilters?.size)
				? (type === "size"
					? appliedFilters.size.filter((v) => v !== value)
					: appliedFilters.size)
				: [],
			volume: Array.isArray(appliedFilters?.volume)
				? (type === "volume"
					? appliedFilters.volume.filter((v) => v !== value)
					: appliedFilters.volume)
				: [],
			minPrice: appliedFilters?.minPrice ?? 0,
			maxPrice: appliedFilters?.maxPrice ?? MAX_PRICE,
			rating: appliedFilters?.rating ?? 0,
			availability: appliedFilters?.availability ?? null,
		};

		setAppliedFilters(nextApplied);
		
		// Update URL with new filters
		updateURL(nextApplied);
		
		await performFilterRequest(nextApplied, false);
	};

	// ---------- Render ----------
	return (
		<>
			<Navbar
				darkMode={darkMode}
				setDarkMode={setDarkMode}
				sx={{ mb: "10px" }}
			/>
			<Box
				sx={{
					display: "flex",
					gap: 3,
					p: 2.5,
					maxWidth: "1400px",
					mx: "auto",
					position: "relative",
					boxSizing: "border-box",
					pt: "50px",
					bgcolor: isDarkMode ? "background.default" : "#fff",
					color: "text.primary",
					flexDirection: { xs: "column", sm: "row" },
				}}
			>
				{/* Backdrop */}
				{drawerOpen && (
					<Box
						sx={{
							position: "fixed",
							top: 0,
							left: 0,
							width: "100vw",
							height: "100vh",
							bgcolor: "rgba(0, 0, 0, 0.5)",
							zIndex: 1999,
						}}
						onClick={() => setDrawerOpen(false)}
					/>
				)}

				{/* Sidebar overlay (sliding drawer) */}
				<Box
					role="dialog"
					aria-hidden={!drawerOpen}
					sx={{
						position: "fixed",
						top: 0,
						left: drawerOpen ? 0 : "-320px",
						width: { xs: "260px", sm: "300px" },
						height: "100vh",
						bgcolor: isDarkMode ? "background.paper" : "#fff",
						boxShadow: 3,
						overflowY: "auto",
						transition: "left 0.3s ease",
						p: 2,
						zIndex: 2000,
					}}
				>
					<Box
						sx={{
							position: "sticky",
							top: 0,
							zIndex: 10,
							bgcolor: isDarkMode
								? theme.palette.primary.dark
								: theme.palette.primary.main,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 1,
							padding: 0.5,
							borderRadius: 1,
						}}
					>
						<Typography variant="h6" sx={{ color: "common.white", px: 1 }}>Filters</Typography>
						<IconButton
							aria-label="close filters"
							onClick={() => setDrawerOpen(false)}
							size="small"
							sx={{ color: "common.white" }}
						>
							<ClearIcon />
						</IconButton>
					</Box>

					<Box
						sx={{
							position: "sticky",
							top: 48,
							zIndex: 20,
						}}
					>
						<Button
							variant="contained"
							fullWidth
							sx={{ mb: 1 }}
							onClick={applyFilters}
						>
							Apply Filters
						</Button>
						<Button
							variant="outlined"
							fullWidth
							startIcon={<ClearIcon />}
							onClick={clearFilters}
							sx={{ 
								zIndex: 25,
								backdropFilter: "blur(10px)",
								backgroundColor: isDarkMode 
									? "rgba(255, 255, 255, 0.1)" 
									: "rgba(0, 0, 0, 0.05)",
								border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
								"&:hover": {
									backdropFilter: "blur(15px)",
									backgroundColor: isDarkMode 
										? "rgba(255, 255, 255, 0.15)" 
										: "rgba(0, 0, 0, 0.1)",
								}
							}}
						>
							Clear Filters
						</Button>
					</Box>

					{/* Price range */}
					<Box
						sx={{
							mb: 2.5,
							pt: 2,
						}}
					>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: "16px",
								mb: 1, // 8px
								color: isDarkMode ? "grey.100" : "text.primary",
							}}
						>
							Price
						</Typography>
						<Box sx={{ px: 1, mt: 1 }}>
							<Slider
								sx={{
									width: "100%",
									bgcolor: isDarkMode ? "background.paper" : "#fff",
								}}
								value={[filters.minPrice, filters.maxPrice]}
								onChange={handlePriceChange}
								valueLabelDisplay="auto"
								min={0}
								max={MAX_PRICE}
								step={1000}
							/>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									mt: 0.5, // 4px
									color: isDarkMode ? "grey.300" : "text.secondary",
								}}
							>
								<Typography className="pl-price-value">
									₹{filters.minPrice}
								</Typography>
								<Typography className="pl-price-value">
									₹{filters.maxPrice}
								</Typography>
							</Box>
						</Box>
					</Box>

					{/* Categories */}
					{options.categories.length > 0 && (
						<Box
							sx={{
								mb: 2.5,
							}}
						>
							<Typography
								sx={{
									fontWeight: 600,
									fontSize: "16px",
									mb: 1, // 8px
									color: isDarkMode ? "grey.100" : "text.primary",
								}}
							>
								Categories
							</Typography>
							<Stack spacing={0.5} sx={{ mt: 1 }}>
								{options.categories.map((c) => (
									<FormControlLabel
										key={c}
										control={
											<Checkbox
												checked={filters.categories.includes(c)}
												onChange={() => toggleArrayFilter("categories", c)}
											/>
										}
										label={toTitleCase(c)}
									/>
								))}
							</Stack>
						</Box>
					)}

					{/* Brands */}
					{options.brands.length > 0 && (
						<Box
							sx={{
								mb: 2.5,
							}}
						>
							<Typography
								sx={{
									fontWeight: 600,
									fontSize: "16px",
									mb: 1, // 8px
									color: isDarkMode ? "grey.100" : "text.primary",
								}}
							>
								Brands
							</Typography>
							<Stack spacing={0.5} sx={{ mt: 1 }}>
								{options.brands.map((b) => (
									<FormControlLabel
										key={b}
										control={
											<Checkbox
												checked={filters.brands.includes(b)}
												onChange={() => toggleArrayFilter("brands", b)}
											/>
										}
										label={toTitleCase(b)}
									/>
								))}
							</Stack>
						</Box>
					)}

					{/* Rating */}
					<Box
						sx={{
							mb: 2.5,
						}}
					>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: "16px",
								mb: 1, // 8px
								color: isDarkMode ? "grey.100" : "text.primary",
							}}
						>
							Rating
						</Typography>
						<Stack spacing={0.5} sx={{ mt: 1 }}>
							{[4, 3, 2].map((r) => (
								<FormControlLabel
									key={r}
									control={
										<Checkbox
											checked={filters.rating === r}
											onChange={() =>
												handleRatingChange(filters.rating === r ? 0 : r)
											}
										/>
									}
									label={`${r} & Above`}
								/>
							))}
						</Stack>
					</Box>

					{/* Availability */}
					<Box
						sx={{
							mb: 2.5,
						}}
					>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: "16px",
								mb: 1, // 8px
								color: isDarkMode ? "grey.100" : "text.primary",
							}}
						>
							Availability
						</Typography>
						<FormControlLabel
							control={
								<Checkbox
									checked={filters.availability === true}
									onChange={toggleAvailability}
								/>
							}
							label="In Stock Only"
						/>
					</Box>

					{/* Dynamic Options */}
					<Box
						sx={{
							mb: 2.5,
						}}
					>
						{Object.entries(options.dynamic).map(([optName, values]) =>
							values.length > 0 ? (
								<Box key={optName} sx={{ mb: 2 }}>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: "16px",
											mb: 1,
											color: isDarkMode ? "grey.100" : "text.primary",
										}}
									>
										{toTitleCase(optName)}
									</Typography>
									<Stack
										direction="row"
										useFlexGap
										sx={{
											flexWrap: "wrap",
											mt: 1,
											rowGap: 1,
											columnGap: 1,
											justifyContent: "flex-start",
										}}
									>
										{values.map((val) => (
											<Button
												key={`${optName}-${val}`}
												size="small"
												onClick={() => toggleArrayFilter(optName, val)}
												variant={
													Array.isArray(filters[optName]) && filters[optName].includes(val)
														? "contained"
														: "outlined"
												}
												sx={{
													textTransform: "none",
													minWidth: 64,
													px: 1.5,
													borderRadius: 2,
												}}
											>
												{toTitleCase(val)}
											</Button>
										))}
									</Stack>
								</Box>
							) : null
						)}
					</Box>
				</Box>
				{/* Main area */}
				<Box
					sx={{
						minHeight: 400,
						flex: 1,
						minWidth: 0,
						transition: "margin-left 0.3s ease",
						bgcolor: isDarkMode ? "background.default" : "#fff",
						color: "text.primary",
						ml: drawerOpen ? { xs: 0, sm: "300px" } : 0, // <-- add this
					}}
				>
					{/* Top bar: Filter button + active chips */}
					<Box
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: 2,
							mb: 2,
							flexWrap: "wrap",
						}}
					>
						<Button
							sx={{
								bgcolor: isDarkMode ? "primary.dark" : "primary.main",
								color: "common.white",
								textTransform: "none",
								position: "sticky",
								top: "10px", // stays visible under navbar
								mb: 2, // 16px
								"&:hover": {
									bgcolor: isDarkMode ? "primary.light" : "primary.dark",
								},
							}}
							variant="contained"
							onClick={() => setDrawerOpen(true)}
							aria-label="Open filters"
						>
							Filter
						</Button>

						{/* Active filter chips */}
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
							{appliedFilters &&
								Array.isArray(appliedFilters.categories) &&
								appliedFilters.categories.map((c) => (
									<Chip
										key={`category-${c}`}
										label={`Category: ${toTitleCase(c)}`}
										onDelete={() => removeChip("categories", c)}
										sx={{
											bgcolor: isDarkMode
												? theme.palette.primary.dark
												: theme.palette.primary.main,
											fontSize: "14px",
											position: "relative",
											color: "common.white", // ensures text stays visible
										}}
									/>
								))}

							{appliedFilters &&
								Array.isArray(appliedFilters.brands) &&
								appliedFilters.brands.map((b) => (
									<Chip
										key={`brand-${b}`}
										label={`Brand: ${toTitleCase(b)}`}
										onDelete={() => removeChip("brands", b)}
										sx={{
											bgcolor: isDarkMode
												? theme.palette.primary.dark
												: theme.palette.primary.main,
											fontSize: "14px",
											position: "relative",
											color: "common.white", // ensures text stays visible
										}}
									/>
								))}

							{appliedFilters &&
								Object.entries(options.dynamic).flatMap(([optName]) => {
									const vals = Array.isArray(appliedFilters[optName])
										? appliedFilters[optName]
										: [];
									return vals.map((val) => (
										<Chip
											key={`${optName}-${val}`}
											label={`${toTitleCase(optName)}: ${toTitleCase(val)}`}
											onDelete={() => removeChip(optName, val)}
											sx={{
												bgcolor: isDarkMode
													? theme.palette.primary.dark
													: theme.palette.primary.main,
												fontSize: "14px",
												position: "relative",
												color: "common.white", // ensures text stays visible
											}}
										/>
									));
								})}

							{appliedFilters && appliedFilters.availability === true && (
								<Chip
									key="instock"
									label="In Stock"
									onDelete={async () => {
										const updatedFilters = { ...filters, availability: null };
										const updatedApplied = { ...appliedFilters, availability: null };
										setFilters(updatedFilters);
										setAppliedFilters(updatedApplied);
										updateURL(updatedApplied);
										await performFilterRequest(updatedApplied, false);
									}}
									sx={{
										bgcolor: isDarkMode
											? theme.palette.primary.dark
											: theme.palette.primary.main,
										fontSize: "14px",
										position: "relative",
										color: "common.white", // ensures text stays visible
									}}
								/>
							)}

					{appliedFilters && appliedFilters.rating > 0 && (
						<Chip
							key="rating"
							label={`${appliedFilters.rating} & Above`}
							onDelete={async () => {
								const updatedFilters = { ...filters, rating: 0 };
								const updatedApplied = { ...appliedFilters, rating: 0 };
								setFilters(updatedFilters);
								setAppliedFilters(updatedApplied);
								updateURL(updatedApplied);
								await performFilterRequest(updatedApplied, false);
							}}
							sx={{
								bgcolor: isDarkMode
									? theme.palette.primary.dark
									: theme.palette.primary.main,
								fontSize: "14px",
								position: "relative",
								color: "common.white",
							}}
						/>
					)}

							{appliedFilters &&
								(appliedFilters.minPrice > 0 ||
									appliedFilters.maxPrice < MAX_PRICE) && (
									<Chip
										label={`₹${appliedFilters.minPrice} - ₹${appliedFilters.maxPrice}`}
										onDelete={async () => {
											const updatedFilters = {
												...filters,
												minPrice: 0,
												maxPrice: MAX_PRICE,
											};
											const updatedApplied = {
												...appliedFilters,
												minPrice: 0,
												maxPrice: MAX_PRICE,
											};
											setFilters(updatedFilters);
											setAppliedFilters(updatedApplied);
											updateURL(updatedApplied);
											await performFilterRequest(updatedApplied, false);
										}}
										sx={{
											bgcolor: isDarkMode
												? theme.palette.primary.dark
												: theme.palette.primary.main,
											fontSize: "14px",
											position: "relative",
											color: "common.white", // ensures text stays visible
										}}
									/>
								)}
						</Stack>
					</Box>

					{/* Results */}
					{loading && !hasInitialLoad ? (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								py: 7.5, // 60px
								color: isDarkMode ? "grey.300" : "text.secondary",
							}}
						>
							<CircularProgress />
						</Box>
					) : error ? (
						<Box
							sx={{
								textAlign: "center",
								py: 5, // 40px
								color: isDarkMode ? "grey.300" : "text.primary",
							}}
						>
							<Typography
								sx={{
									fontWeight: 600,
									fontSize: "18px",
									mb: 1, // 8px
									color: isDarkMode ? "grey.100" : "text.primary",
								}}
							>
								Error
							</Typography>
							<Typography
								sx={{
									fontSize: "15px",
									color: isDarkMode ? "grey.400" : "grey.600",
								}}
							>
								{error}
							</Typography>
							<Button
								variant="outlined"
								onClick={() => window.location.reload()}
								sx={{ mt: 2 }}
							>
								Retry
							</Button>
						</Box>
					) : (
						<>
							<Typography 
								variant="h6"
								sx={{
									mb: 2,
									fontWeight: 500,
									color: isDarkMode ? "grey.100" : "text.primary",
								}}
							>
								{total ?? products.length} results
							</Typography>

							{hasInitialLoad && products.length === 0 ? (
								<Box
									sx={{
										textAlign: "center",
										py: 5, // 40px
										color: isDarkMode ? "grey.300" : "text.primary",
									}}
								>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: "18px",
											mb: 1, // 8px
											color: isDarkMode ? "grey.100" : "text.primary",
										}}
									>
										No products found
									</Typography>
									<Typography
										sx={{
											fontSize: "15px",
											color: isDarkMode ? "grey.400" : "grey.600",
										}}
									>
										Try changing filters or clear them.
									</Typography>
								</Box>
							) : (
								<Box>
									{loading && hasInitialLoad && (
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
												py: 2,
											}}
										>
											<CircularProgress size={24} />
										</Box>
									)}
								<div className="grid gap-4 sm:gap-5 p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
										{products.map((product) => (
											<Link
												key={product.id}
												to={`/product/${product.id}`}
												className={`flex flex-col rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
													isDarkMode
														? "border-gray-700 bg-gray-800 text-gray-100 hover:border-gray-600"
														: "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
												}`}
											>
											<img
													src={
														product.image.startsWith('https') 
															? product.image 
															: `${API_BASE_URL}${product.image}`
													}
													alt={product.name || 'Product'}
												className={`w-full aspect-[4/3] object-cover object-center block ${
														isDarkMode ? "bg-gray-900" : "bg-gray-100"
													}`}
												loading="lazy"
												decoding="async"
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
												/>

												<div
													className={`flex flex-col flex-1 p-3 ${
														isDarkMode ? "bg-gray-900" : "bg-white"
													}`}
												>
											<h3
														className={`text-base font-semibold mb-1 line-clamp-2 ${
															isDarkMode ? "text-gray-100" : "text-gray-900"
												} min-h-[40px]`}
														title={product.name}
													>
														{product.name || 'Unnamed Product'}
													</h3>

													<p
														className={`text-lg font-bold mb-2 ${
															isDarkMode ? "text-green-400" : "text-green-700"
														}`}
													>
														₹{product.price?.toLocaleString() || '0'}
													</p>

													{product.options && Object.keys(product.options).length > 0 && (
														<div className="mb-2 space-y-1">
															{Object.entries(product.options).slice(0, 2).map(([key, values]) => (
																<div key={key} className="flex gap-1 text-sm">
																	<span className="font-medium">
																		{toTitleCase(key)}:
																	</span>
																	<span
																		className={
																			isDarkMode
																				? "text-gray-400"
																				: "text-gray-600"
																		}
																	>
																		{Array.isArray(values)
																			? `${values.length} option${values.length > 1 ? "s" : ""}`
																			: String(values)}
																	</span>
																</div>
															))}
														</div>
													)}

													<div className="mt-auto flex justify-between items-center text-sm">
														<div className="flex items-center gap-1">
															<span
																className={
																	isDarkMode
																		? "text-yellow-400"
																		: "text-yellow-600"
																}
															>
																⭐
															</span>
															<span>{product.rating || "N/A"}</span>
														</div>
														<span
															className={`font-medium ${
																product.in_stock
																	? "text-green-600"
																	: "text-red-500"
															}`}
														>
															{product.in_stock ? "In Stock" : "Out of Stock"}
														</span>
													</div>
												</div>
											</Link>
										))}
									</div>

									{/* Load more */}
									{products.length < total && (
										<Box
											sx={{ display: "flex", justifyContent: "center", mt: 4 }}
										>
											<Button
												variant="contained"
												onClick={loadMore}
												disabled={loading}
												sx={{
													textTransform: "none",
													px: 4,
													py: 1.5,
													borderRadius: 2,
													bgcolor: isDarkMode ? "primary.dark" : "primary.main",
													"&:hover": {
														bgcolor: isDarkMode
															? "primary.light"
															: "primary.dark",
													},
													"&:disabled": {
														bgcolor: isDarkMode ? "grey.800" : "grey.300",
													},
												}}
											>
												{loading ? (
													<>
														<CircularProgress size={16} sx={{ mr: 1 }} />
														Loading...
													</>
												) : (
													"Load More"
												)}
											</Button>
										</Box>
									)}
								</Box>
							)}
						</>
					)}
				</Box>
			</Box>
			<Footer />
		</>
	);
};

export default ProductListing;
