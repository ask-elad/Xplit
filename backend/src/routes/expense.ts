import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();

import authMiddleware from '../middleware/authMiddleware';
export const expenseRouter = Router();

expenseRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const description = req.body.description;
    const amount = Number(req.body.amount);
    const paidById = Number(req.body.paidbyId);
    const tripId = Number(req.body.tripId);
    const splitEqual = req.body.splitEqual;

    if (!description || isNaN(amount) || isNaN(paidById)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    await client.expense.create({
      data: {
        description,
        amount,
        paidById,
        tripId,
        splitEqual,
        date: new Date()
      }
    });

    return res.json({
      message: "Expense created"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

expenseRouter.get('/:tripId', authMiddleware, async (req, res) => {

  try {
    const tripId = Number(req.params.tripId);
    if (isNaN(tripId)) {
      return res.status(400).json({ error: 'Invalid tripId' });
    }

    const expenses = await client.expense.findMany({
      where: { tripId },
      orderBy: { date: 'desc' },
      include: {
        paidBy: {
          select: {
            id: true,
            username: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    res.status(200).json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Something went wrong while fetching expenses' });
  }
});

expenseRouter.get('/detail/:expenseId', authMiddleware, async (req, res) => {
  try {
    const expenseId = Number(req.params.expenseId);
    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expenseId' });
    }

    const expense = await client.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidBy: {
          select: {
            id: true,
            username: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json(expense);
  } catch (err) {
    console.error('Error fetching expense detail:', err);
    res.status(500).json({ error: 'Something went wrong while fetching expense detail' });
  }
});

expenseRouter.put('/:expenseId', authMiddleware, async (req, res) => {
  try {
    const expenseId = Number(req.params.expenseId);
    const { description, amount, splitEqual } = req.body;

    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expenseId' });
    }

    const existing = await client.expense.findUnique({
      where: { id: expenseId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const updatedExpense = await client.expense.update({
      where: { id: expenseId },
      data: {
        description: description ?? existing.description,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        splitEqual: splitEqual !== undefined ? splitEqual : existing.splitEqual
      }
    });

    res.status(200).json(updatedExpense);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Something went wrong while updating expense' });
  }
});

expenseRouter.delete('/:expenseId', authMiddleware, async (req, res) => {
  try {
    const expenseId = Number(req.params.expenseId);
    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expenseId' });
    }

    const existing = await client.expense.findUnique({
      where: { id: expenseId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await client.expense.delete({
      where: { id: expenseId }
    });

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Something went wrong while deleting expense' });
  }
});
