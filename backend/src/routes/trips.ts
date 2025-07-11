import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();

import authMiddleware from '../middleware/authMiddleware';
export const tripRouter = Router();
 
tripRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const name = req.body.name;
    const id = Number(req.id);  

    const trip = await client.trip.create({
      data: {
        name,
        createdById: id,
      },
    });

    await client.tripParticipant.create({
      data: {
        userId: id,
        tripId: trip.id,
      },
    });

    res.status(201).json({
      message: "Trip created successfully",
      tripId: trip.id,
    });

  } catch (err) {
    console.error("Error creating trip:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tripRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.id);

    const participantLinks = await client.tripParticipant.findMany({
      where: { userId },
      select: {
        trip: {
          select: {
            id: true,
            name: true,
            createdBy: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const trips = participantLinks.map(link => link.trip);

    res.json({
      trips,
    });

  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tripRouter.put('/:tripId', authMiddleware, async (req, res) => {

  try {
    const tripId = parseInt(req.params.tripId);
    const userId = Number(req.id);
    const name = req.body.name;

    if (isNaN(tripId)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }

    const trip = await client.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (trip.createdById !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await client.trip.update({
      where: { id: tripId },
      data: { name },
    });

    res.status(200).json({
      message: "Trip updated successfully",
    });

  } catch (err) {
    console.error("Error updating trip:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

tripRouter.get('/:tripId', authMiddleware, async (req, res) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const userId = Number(req.id);

    if (isNaN(tripId)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }

    const isParticipant = await client.tripParticipant.findFirst({
      where: {
        tripId,
        userId,
      },
    });

    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this trip" });
    }

    const trip = await client.trip.findUnique({
      where: { id: tripId },
      include: {
        participantLinks: {
          include: {
            user: true,
          },
        },
        expenses: true,
        balances: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ trip });

  } catch (err) {
    console.error("Error fetching trip:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//DELETE /api/v1/trips/:tripId → Delete a trip (only creator). once everything is done 

//----------------------------------------Trip management -------------------------------------------------------------

