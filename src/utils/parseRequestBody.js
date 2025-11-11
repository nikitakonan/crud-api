/**
 * Parses JSON body from request stream
 * @param {import('http').IncomingMessage} req - The incoming HTTP request
 * @returns {Promise<any>} Parsed JSON object
 * @throws {Error} If body is not valid JSON
 */
export const parseRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
};
