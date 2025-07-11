import express from 'express';
const app = express();

import {userRouter} from './routes/auth'
import {tripRouter} from './routes/trips'
import { participantRouter } from './routes/participants';
import { expenseRouter } from './routes/expense';
import { balanceRouter } from './routes/balance';

app.use("/api/v1/auth", userRouter);
app.use("/api/v1/trips", tripRouter);
app.use("/api/v1/participants", participantRouter);
app.use("/expense", expenseRouter);
app.use("/balance", balanceRouter);

