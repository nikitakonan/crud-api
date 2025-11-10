/**
 * Validates UUID v4 format
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID v4 format
 */
export const isValidUUID = (uuid) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
};
