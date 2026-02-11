import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ===== CORS ===== */
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ===== BODY PARSER ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== DB ===== */
connectDB();

/* ===== ROUTES ===== */
app.get('/', (req, res) => {
  res.json({ message: 'Sonani Electronics API Running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

/* ===== SERVER ===== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
