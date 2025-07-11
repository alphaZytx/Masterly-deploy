import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes';

const app = express();

// --- CORS should be set up on the app, not the router ---
const allowedOrigins = [
  'http://localhost:3000', // frontend dev
  // add other origins if needed
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// --- Use adminRoutes for all /api/admin endpoints ---
app.use('/api/admin', adminRoutes);

// --- Start the server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});