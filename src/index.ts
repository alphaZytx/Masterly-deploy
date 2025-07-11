import express from 'express';
import adminRoutes from './routes/adminRoutes';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 