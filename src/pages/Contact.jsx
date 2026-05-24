// import React from "react";
// import { Container, Typography, TextField, Button } from "@mui/material";

// const Contact = () => {
//   return (
//     <Container maxWidth="sm" sx={{ mt: 4 }}>
//       <Typography variant="h4" fontWeight="bold" gutterBottom>
//         Contact Us
//       </Typography>
//       <Typography variant="body1" gutterBottom>
//         We'd love to hear from you! Fill out the form below and we’ll get back to you.
//       </Typography>

//       <form>
//         <TextField label="Your Name" fullWidth margin="normal" required />
//         <TextField label="Your Email" fullWidth margin="normal" required />
//         <TextField
//           label="Message"
//           fullWidth
//           margin="normal"
//           multiline
//           rows={4}
//           required
//         />
//         <Button variant="contained" color="primary" sx={{ mt: 2 }}>
//           Send Message
//         </Button>
//       </form>
//     </Container>
//   );
// };

// export default Contact;
import React, { useState } from "react";
import { Container, Typography, TextField, Button, Alert } from "@mui/material";
import axios from "axios";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 👇 send data to backend API
      const res = await axios.post("http://localhost:5000/api/contact", form);
      if (res.status === 200) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" gutterBottom>
        We'd love to hear from you! Fill out the form below and we’ll get back to you.
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Your Name"
          name="name"
          fullWidth
          margin="normal"
          required
          value={form.name}
          onChange={handleChange}
        />
        <TextField
          label="Your Email"
          name="email"
          fullWidth
          margin="normal"
          required
          value={form.email}
          onChange={handleChange}
        />
        <TextField
          label="Message"
          name="message"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          required
          value={form.message}
          onChange={handleChange}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Send Message
        </Button>
      </form>

      {status === "success" && <Alert severity="success" sx={{ mt: 2 }}>Message sent successfully!</Alert>}
      {status === "error" && <Alert severity="error" sx={{ mt: 2 }}>Failed to send message. Try again.</Alert>}
    </Container>
  );
};

export default Contact;
