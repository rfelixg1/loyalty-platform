import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import campaignsRouter from './routes/campaigns.js';
import customersRouter from './routes/customers.js';
import transactionsRouter from './routes/transactions.js';
import merchantsRouter from './routes/merchants.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/campaigns', campaignsRouter);
app.use('/customers', customersRouter);
app.use('/transactions', transactionsRouter);
app.use('/merchants', merchantsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
}); 