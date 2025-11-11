/**
 * Sends JSON response
 * @param {import('http').ServerResponse} res - The server response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Data to send
 */
export const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

/**
 * Sends error response
 * @param {import('http').ServerResponse} res - The server response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
export const sendError = (res, statusCode, message) => {
  sendJson(res, statusCode, { message });
};

/**
 * Sends no content response (204)
 * @param {import('http').ServerResponse} res - The server response object
 */
export const sendNoContent = (res) => {
  res.writeHead(204);
  res.end();
};
