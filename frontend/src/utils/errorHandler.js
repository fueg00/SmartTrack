
export const getErrorMessage = (err, defaultMessage = 'An unexpected error occurred') => {
  if (err.response) {
    // The server responded with a status code that falls out of the range of 2xx
    return err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
  } else if (err.request) {
    // The request was made but no response was received
    // This happens when the server is down or timing out
    return 'Cannot reach the server. It might be starting up (cold start) or experiencing an outage. Please try again in 30 seconds.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return err.message || defaultMessage;
  }
};
