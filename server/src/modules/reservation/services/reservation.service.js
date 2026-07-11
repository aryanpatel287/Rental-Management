import * as reservationRepo from '../repository/reservation.repository.js';
import { db } from '../../../config/database.js';

export async function createReservation({ orderItemId, productId, variantId, quantity, reservedFrom, reservedTo }, tx = db) {
    return reservationRepo.create({
        orderItemId,
        productId,
        variantId,
        quantity,
        reservedFrom: new Date(reservedFrom),
        reservedTo: new Date(reservedTo),
        status: 'Reserved'
    }, tx);
}

export async function releaseReservation(reservationId, tx = db) {
    return reservationRepo.updateStatus(reservationId, 'Released', tx);
}

export async function completeReservation(reservationId, tx = db) {
    return reservationRepo.updateStatus(reservationId, 'Completed', tx);
}
