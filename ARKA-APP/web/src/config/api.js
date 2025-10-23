export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const joinUrl = (base, endpoint) => {
  if (!base) {
    return endpoint;
  }
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedEndpoint}`;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = joinUrl(API_BASE_URL, endpoint);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REACT_APP_API_KEY ? { 'X-API-Key': process.env.REACT_APP_API_KEY } : {}),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = new Error(getErrorMessage(response.status));
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

const getErrorMessage = (status) => {
  switch (status) {
    case 401:
      return 'Accès non autorisé';
    case 404:
      return 'Ressource non trouvée';
    case 429:
      return 'Quota atteint — réessayer plus tard';
    case 500:
    case 502:
    case 503:
      return 'Service indisponible — réessayer';
    default:
      return `Erreur HTTP ${status}`;
  }
};
