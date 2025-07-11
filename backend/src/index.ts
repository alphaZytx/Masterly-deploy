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

// --- Public admin registration and login ---
app.post('/api/admin/register', registerAdmin);
app.post('/api/admin/login', loginAdmin);


// --- Protected admin routes ---
app.use(protectAdmin, admin);

// User Management Routes
app.get('/api/admin/users', getAllUsers);
app.route('/api/admin/users/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

// Concept (Course) Management Routes
app.post('/api/admin/concepts', conceptValidationRules(), validate, createConcept);
app.route('/api/admin/concepts/:id')
    .put(conceptValidationRules(), validate, updateConcept)
    .delete(deleteConcept);

// Protected admin profile (for dashboard)
app.get('/api/admin/profile', getAdminProfile);

// ...existing code to start the server...