import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();

import authMiddleware from '../middleware/authMiddleware';
export const balanceRouter = Router();

balanceRouter.get('/:tripId', authMiddleware,async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);

    const tripData = await client.trip.findUnique({
      where: {
        id: tripId,
      },
      select: {
        expenses: {
          select: {
            amount: true,
            paidById: true,
            participants: {
              select: {
                userId: true,
                share: true,
              },
            },
          },
        },
      },
    });

    if (!tripData) return res.status(404).json({ message: 'Trip not found' });

    const balances: { from: { id: number }, to: { id: number }, amount: number }[] = []; 

    tripData.expenses.forEach((expense) => {
      const payerId = expense.paidById;

      expense.participants.forEach((participant) => {
        const participantId = participant.userId;
        const shareAmount = participant.share;

        if (participantId !== payerId) {
          // Check if this from → to pair already exists in balances
          const existing = balances.find(
            (entry) => entry.from.id === participantId && entry.to.id === payerId
          );

          if (existing) {
            existing.amount += shareAmount;
          } else {
            balances.push({
              from: { id: participantId },
              to: { id: payerId },
              amount: shareAmount,
            });
          }
        }
      });
    });

    
    balances.forEach((entry) => {
      entry.amount = Math.round(entry.amount * 100) / 100;
    });

    res.status(200).json(balances);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

balanceRouter.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const userTrips = await client.tripParticipant.findMany({
      where: {
        userId,
      },
      select: {
        tripId: true,
        trip: {
          select: {
            name: true,
            expenses: {
              select: {
                amount: true,
                paidById: true,
                participants: {
                  select: {
                    userId: true,
                    share: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const owes: {
      to: { id: number };
      amount: number;
      tripId: number;
      tripName: string;
    }[] = [];

    const lent: {
      to: { id: number };
      amount: number;
      tripId: number;
      tripName: string;
    }[] = [];

    userTrips.forEach((entry) => {
      const tripId = entry.tripId;
      const tripName = entry.trip.name;

      entry.trip.expenses.forEach((expense) => {
        const payerId = expense.paidById;

        expense.participants.forEach((participant) => {
          const participantId = participant.userId;
          const shareAmount = participant.share;

          //user owes someone
          if (participantId === userId && payerId !== userId) {
            const existingOwe = owes.find(
              (entry) =>
                entry.to.id === payerId &&
                entry.tripId === tripId
            );

            if (existingOwe) {
              existingOwe.amount += shareAmount;
            } else {
              owes.push({
                to: { id: payerId },
                amount: shareAmount,
                tripId,
                tripName,
              });
            }
          }

          
          if (payerId === userId && participantId !== userId) {
            const existingLent = lent.find(
              (entry) =>
                entry.to.id === participantId &&
                entry.tripId === tripId
            );

            if (existingLent) {
              existingLent.amount += shareAmount;
            } else {
              lent.push({
                to: { id: participantId },
                amount: shareAmount,
                tripId,
                tripName,
              });
            }
          }
        });
      });
    });

    owes.forEach((entry) => {
      entry.amount = Math.round(entry.amount * 100) / 100;
    });

    lent.forEach((entry) => {
      entry.amount = Math.round(entry.amount * 100) / 100;
    });

    res.status(200).json({
      userId,
      owes,
      lent,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

balanceRouter.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.id; // from authMiddleware

    const userTrips = await client.tripParticipant.findMany({
      where: {
        userId,
      },
      select: {
        tripId: true,
        trip: {
          select: {
            name: true,
            expenses: {
              select: {
                amount: true,
                paidById: true,
                participants: {
                  select: {
                    userId: true,
                    share: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalOwes = 0;
    let totalLent = 0;

    const breakdown: {
      tripId: number;
      tripName: string;
      owes: number;
      lent: number;
    }[] = [];

    userTrips.forEach((entry) => {
      const tripId = entry.tripId;
      const tripName = entry.trip.name;

      let tripOwes = 0;
      let tripLent = 0;

      entry.trip.expenses.forEach((expense) => {
        const payerId = expense.paidById;

        expense.participants.forEach((participant) => {
          const participantId = participant.userId;
          const shareAmount = participant.share;

          if (participantId === userId && payerId !== userId) {
            tripOwes += shareAmount;
          }

          if (payerId === userId && participantId !== userId) {
            tripLent += shareAmount;
          }
        });
      });

      totalOwes += tripOwes;
      totalLent += tripLent;

      breakdown.push({
        tripId,
        tripName,
        owes: Math.round(tripOwes * 100) / 100,
        lent: Math.round(tripLent * 100) / 100,
      });
    });

    res.status(200).json({
      userId,
      totalOwes: Math.round(totalOwes * 100) / 100,
      totalLent: Math.round(totalLent * 100) / 100,
      breakdown,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});


