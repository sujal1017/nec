import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Rating,
  Chip,
  Button,
  Divider,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from 'axios';
import { BaseUrl } from '../config';

const Bids = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [activeBids, setActiveBids] = useState([]);
  const [pastBids, setPastBids] = useState([]);
  const [timeLefts, setTimeLefts] = useState({});



  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}/orders/auctions/my-bids/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, 
          }
        }
      );

      if (res.status == 200) {
        setPastBids(res.data);
        setActiveBids(res.data);
      }
      else if (res.status == 401) {
        navigate('/signin');
      }
      else {
        console.log("error occur  response : ", res);
      }
    } catch (error) {
      console.log("error", error);
    }
    finally {
      setLoading(false);
    }
  }

  const getTimeLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };


  useEffect(() => {
  fetchData(); // initial

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLefts(() => {
        const updated = {};
        activeBids.forEach(bid => {
          updated[bid.id] = getTimeLeft(bid.end_time);
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBids]);


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePlaceBid = async () => {
    if (!selectedProduct || !bidAmount) return;

    const newBid = {
      id: bids.length + 1,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      currentBid: parseInt(bidAmount),
      yourBid: parseInt(bidAmount),
      timeLeft: "7d 0h 0m",
      status: "leading",
      bids: 1,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    try {
      // Update local state
      setBids([newBid, ...bids]);

      // Save to bids.json
      const response = await fetch('/data/bids.json', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bids: [newBid, ...bids] }),
      });

      if (!response.ok) {
        throw new Error('Failed to save bid');
      }

      setBidDialogOpen(false);
      setBidAmount('');
      setSelectedProduct(null);
      setBidPlaced(true);
    } catch (error) {
      console.error('Error saving bid:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar sx={{ mb: '10px' }} />
      <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, mt: '100px' }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          width: '100%'
        }}>
          <GavelIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            My Bids
          </Typography>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 3,
              '& .MuiTab-root': {
                minWidth: 200,
                fontSize: '1rem',
                fontWeight: 'medium'
              }
            }}
          >
            <Tab
              label={`Active Bids ()`}
              sx={{
                textTransform: 'none',
                minWidth: 'auto',
                px: 3
              }}
            />
            <Tab
              label={`Past Bids ()`}
              sx={{
                textTransform: 'none',
                minWidth: 'auto',
                px: 3
              }}
            />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {activeTab === 0 ? (
                activeBids.length > 0 ? (

                  activeBids.map((bid) => (
                    <Card key={bid.id} sx={{ width: '100%', mb: 2 }}>
                      <Grid container alignItems="stretch">
                        {/* Left Side - responsive image wrapper */}
                        <Grid
                          item
                          xs={12}
                          sm={4}
                          sx={{
                            display: 'flex',
                            justifyContent: { xs: 'center', sm: 'flex-start' },
                            alignItems: 'center',
                            p: { xs: 0, sm: 2 },    // optional padding on larger screens
                          }}
                        >
                          {/* Box controls the responsive box size and clipping */}
                          <Box
                            sx={{
                              width: { xs: '100%', sm: 200 },     // full width on xs, fixed on sm+
                              height: { xs: 'auto', sm: 200 },    // auto height on xs, fixed on sm+
                              borderRadius: 2,
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={bid.image}
                              alt={bid.product_name}
                              sx={{
                                width: '100%',
                                height: { xs: 'auto', sm: '100%' }, // fill box on desktop, keep aspect on mobile
                                objectFit: 'cover',                 // fill & crop if needed
                                objectPosition: 'center',
                                display: 'block',
                              }}
                            />
                          </Box>
                        </Grid>

                        {/* Right Side - Content */}
                        <Grid item xs={12} sm={8}>
                          <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography
                              variant="h6"
                              component={Link}
                              to={`/product/${bid.product_name}`}
                              sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {bid.product_name}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                              <Typography variant="body1" fontWeight="medium" color="secondary">
                                Current Bid: ₹{bid.amount.toLocaleString('en-IN')}
                              </Typography>
                              <Chip label={`${bid.bids} bids`} color="primary" variant="outlined" size="small" />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="body1" color="primary" fontWeight="medium">
                                Your Bid: ₹{bid.amount.toLocaleString('en-IN')}
                              </Typography>
                              <Chip label={bid.status === 'leading' ? 'Leading' : 'Outbid'} color={bid.status === 'leading' ? 'success' : 'error'} size="small" />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <AccessTimeIcon fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                Time Left: {timeLefts[bid.id] || "Loading..."}
                              </Typography>

                            </Box>

                            <Box sx={{ mt: 'auto' }}>
                              <Button variant="contained" color="primary" component={Link} to={`/product/${bid.productId}`}>
                                View Auction
                              </Button>
                            </Box>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No active bids
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      component={Link}
                      to="/products"
                    >
                      Browse Products
                    </Button>
                  </Box>
                )
              )
                : (
                  pastBids.length > 0 ? (
                    pastBids.map((bid) => (
                      <Card key={bid.id} sx={{ width: '100%', mb: 2 }}>
                        <Grid container alignItems="stretch">
                          {/* Left Side - responsive image wrapper */}
                          <Grid
                            item
                            xs={12}
                            sm={4}
                            sx={{
                              display: 'flex',
                              justifyContent: { xs: 'center', sm: 'flex-start' },
                              alignItems: 'center',
                              p: { xs: 0, sm: 2 }, // optional padding on larger screens
                            }}
                          >
                            {/* Box controls responsive size & clipping */}
                            <Box
                              sx={{
                                width: { xs: '100%', sm: 200 },
                                height: { xs: 'auto', sm: 200 },
                                borderRadius: 2,
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              <CardMedia
                                component="img"
                                image={bid.productImage}
                                alt={bid.productName}
                                sx={{
                                  width: '100%',
                                  height: { xs: 'auto', sm: '100%' },
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  display: 'block',
                                }}
                              />
                            </Box>
                          </Grid>

                          {/* Right Side - Content */}
                          <Grid item xs={12} sm={8}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {/* Product Name */}
                              <Typography
                                variant="h6"
                                component={Link}
                                to={`/product/${bid.productId}`}
                                sx={{
                                  textDecoration: 'none',
                                  color: 'primary.main',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {bid.productName}
                              </Typography>

                              {/* Final Price & Your Bid */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                                <Typography variant="body1" fontWeight="medium" color="secondary">
                                  Final Price: ₹{bid.amount.toLocaleString('en-IN')}
                                </Typography>

                              </Box>
                              {/* Status Chip */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <Typography
                                  variant="body1"
                                  color="primary"
                                  fontWeight="medium"
                                >
                                  Your Bid: ₹{bid.yourBid.toLocaleString('en-IN')}
                                </Typography>

                                <Chip
                                  label={bid.status === "won" ? "Won" : "Lost"}
                                  color={bid.status === "won" ? "success" : "error"}
                                  size="small"

                                />
                              </Box>

                              {/* Ended Date */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <AccessTimeIcon fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                  Ended: {new Date(bid.endDate).toLocaleString()}
                                </Typography>
                              </Box>




                              {/* Button at bottom */}
                              <Box sx={{ mt: 'auto' }}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  component={Link}
                                  to={`/product/${bid.productId}`}
                                >
                                  View Product
                                </Button>
                              </Box>
                            </CardContent>
                          </Grid>
                        </Grid>
                      </Card>
                    ))

                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No past bids
                      </Typography>
                    </Box>
                  )
                )}
            </Box>
          )}
        </Box>

        {/* Bid Dialog */}
        <Dialog
          open={bidDialogOpen}
          onClose={() => setBidDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <GavelIcon color="primary" />
            Place Bid
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {selectedProduct?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={selectedProduct?.rating} precision={0.5} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">({selectedProduct?.rating})</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Current Price: ₹{selectedProduct?.price.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Your Bid Amount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
              }}
              error={bidAmount && parseInt(bidAmount) <= selectedProduct?.price}
              helperText={bidAmount && parseInt(bidAmount) <= selectedProduct?.price ?
                `Bid must be higher than ₹${selectedProduct?.price.toLocaleString('en-IN')}` :
                ''}
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mb: 2 }}>
              By placing a bid, you agree to our Terms of Service and confirm that you have read our Auction Policy.
            </Alert>
          </DialogContent>
          <DialogActions sx={{
            p: 2,
            pt: 1,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
          }}>
            <Button
              onClick={() => setBidDialogOpen(false)}
              color="inherit"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBid}
              variant="contained"
              color="primary"
              disabled={!bidAmount || parseInt(bidAmount) <= selectedProduct?.price}
            >
              Place Bid
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Alert */}
        <Snackbar
          open={bidPlaced}
          autoHideDuration={3000}
          onClose={() => setBidPlaced(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setBidPlaced(false)} severity="success" sx={{ width: '100%' }}>
            Your bid has been placed successfully!
          </Alert>
        </Snackbar>
      </Box>
      <Footer />
    </>
  );
};

export default Bids; 