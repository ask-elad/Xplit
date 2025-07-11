"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create Users
        const [alice, bob, charlie] = yield Promise.all([
            prisma.user.create({ data: { username: "alice", password: "pass123" } }),
            prisma.user.create({ data: { username: "bob", password: "pass456" } }),
            prisma.user.create({ data: { username: "charlie", password: "pass789" } }),
        ]);
        // Create Trip 1: Goa Trip
        const trip1 = yield prisma.trip.create({
            data: {
                name: "Goa Trip",
                createdById: alice.id,
            },
        });
        // Add participants to Goa Trip
        yield prisma.tripParticipant.createMany({
            data: [
                { userId: alice.id, tripId: trip1.id },
                { userId: bob.id, tripId: trip1.id },
                { userId: charlie.id, tripId: trip1.id },
            ],
        });
        // Expense 1: Dinner by Alice (₹900), split equally
        const expense1 = yield prisma.expense.create({
            data: {
                description: "Dinner",
                amount: 900,
                paidById: alice.id,
                tripId: trip1.id,
                splitEqual: true,
                participants: {
                    create: [
                        { userId: alice.id, share: 300 },
                        { userId: bob.id, share: 300 },
                        { userId: charlie.id, share: 300 },
                    ],
                },
            },
        });
        // Expense 2: Taxi by Bob (₹600), split equally
        const expense2 = yield prisma.expense.create({
            data: {
                description: "Taxi",
                amount: 600,
                paidById: bob.id,
                tripId: trip1.id,
                splitEqual: true,
                participants: {
                    create: [
                        { userId: alice.id, share: 200 },
                        { userId: bob.id, share: 200 },
                        { userId: charlie.id, share: 200 },
                    ],
                },
            },
        });
        // Create Trip 2: Manali Trip
        const trip2 = yield prisma.trip.create({
            data: {
                name: "Manali Trip",
                createdById: bob.id,
            },
        });
        // Add participants to Manali Trip
        yield prisma.tripParticipant.createMany({
            data: [
                { userId: bob.id, tripId: trip2.id },
                { userId: charlie.id, tripId: trip2.id },
            ],
        });
        // Expense 3: Hotel by Charlie (₹2000), split equally
        const expense3 = yield prisma.expense.create({
            data: {
                description: "Hotel",
                amount: 2000,
                paidById: charlie.id,
                tripId: trip2.id,
                splitEqual: true,
                participants: {
                    create: [
                        { userId: bob.id, share: 1000 },
                        { userId: charlie.id, share: 1000 },
                    ],
                },
            },
        });
        console.log("Seeded sample data.");
    });
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
