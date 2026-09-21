export const sendResponse = async (statusCode, body) => {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
};
