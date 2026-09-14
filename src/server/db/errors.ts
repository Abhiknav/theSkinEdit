export class BookingError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export const BOOKING_ERROR_STATUS: Record<string, number> = {
  SLOT_NOT_FOUND: 410,
  SLOT_TAKEN: 409,
  SLOT_PAST: 410,
  MODE_UNAVAILABLE: 409,
  NOT_FOUND: 404,
  NOT_ACTIVE: 409,
  TOO_LATE: 422,
  REFERENCE_COLLISION: 500,
  UNAUTHORIZED: 401,
};
