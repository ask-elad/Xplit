import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();

import authMiddleware from '../middleware/authMiddleware';
export const participantRouter = Router();

participantRouter.post('/:tripId', authMiddleware, async (req, res) => {
    const tripId = Number(req.params.tripId);
    const usertoAdd = req.body.userId;

    try {
        const trip = await client.trip.findUnique({
            where: { id: tripId }
        });

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        if (trip.createdById !== req.id) {
            return res.status(403).json({ message: "Only trip creator can add participants" });
        }

        const alreadyParticipant = await client.tripParticipant.findFirst({
            where: {
                tripId,
                userId: usertoAdd
            }
        });

        if (alreadyParticipant) {
            return res.status(400).json({ message: "User is already a participant of this trip" });
        }

        await client.tripParticipant.create({
            data: {
                userId: usertoAdd,
                tripId
            }
        });

        res.json({ message: "Participant added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

participantRouter.get('/:tripId', authMiddleware, async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);

    if (isNaN(tripId)) {
      return res.status(400).json({ error: 'Invalid tripId' });
    }

    const participants = await client.tripParticipant.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.json(participants);
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: 'Something went wrong', details: err });
  }
});

participantRouter.delete('/:tripId/:userId', authMiddleware, async (req,res)=> {

    const id = Number(req.params.tripId);
    const userId = Number(req.params.userId);

    const data = await client.tripParticipant.findFirst({
        where:{
            tripId :id,
            userId
        }
    })

    if(data===null){return res.json({message:"no such trip and user exists"})}

    await client.tripParticipant.delete({
        where:{
            id:data.id
        }
    })

    res.json({
        message:"deleted sucessfully"
    })
});