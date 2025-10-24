export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '/api';
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

const resolveUrl = (endpoint) => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base = API_BASE_URL || '';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (/^https?:\/\//i.test(base)) {
    const url = new URL(base);
    const basePath = url.pathname.replace(/\/+$/, '');
    const finalPath = normalizedEndpoint.startsWith(basePath)
      ? normalizedEndpoint
      : `${basePath}${normalizedEndpoint}`;
    url.pathname = finalPath.replace(/\/{2,}/g, '/');
    return url.toString();
  }

  if (!base) {
    return normalizedEndpoint.replace(/\/{2,}/g, '/');
  }

  const normalizedBase = base.startsWith('/') ? base : `/${base}`;
  const basePath = normalizedBase.replace(/\/+$/, '');
  if (normalizedEndpoint.startsWith(basePath)) {
    return normalizedEndpoint;
  }
  return `${basePath}${normalizedEndpoint}`.replace(/\/{2,}/g, '/');
};

const prepareRequestInit = (options = {}) => {
  const { headers = {}, body, ...rest } = options;
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(process.env.REACT_APP_API_KEY ? { 'X-API-Key': process.env.REACT_APP_API_KEY } : {}),
    ...headers,
  };

  let finalBody = body;
  const isFormData = body instanceof FormData;
  if (isFormData) {
    delete finalHeaders['Content-Type'];
    delete finalHeaders['content-type'];
  }

  const isJsonBody =
    !isFormData &&
    finalHeaders['Content-Type']?.includes('application/json') &&
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob);
  if (isJsonBody) {
    finalBody = JSON.stringify(body);
  }

  return {
    method: 'GET',
    ...rest,
    headers: finalHeaders,
    ...(finalBody !== undefined ? { body: finalBody } : {}),
  };
};

const detectParser = (parse, response) => {
  if (parse && parse !== 'auto') {
    return parse;
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return 'json';
  }
  if (contentType.startsWith('text/')) {
    return 'text';
  }
  return 'raw';
};

export const apiCall = async (endpoint, options = {}) => {
  const { parse = 'auto', raw = false, ...fetchOptions } = options;
  const url = resolveUrl(endpoint);
  const init = prepareRequestInit(fetchOptions);

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const networkError = err instanceof Error ? err : new Error(String(err));
    networkError.status = 0;
    throw networkError;
  }

  if (!response.ok) {
    const error = new Error(getErrorMessage(response.status));
    error.status = response.status;
    throw error;
  }

  if (raw) {
    return response;
  }

  if (response.status === 204) {
    return null;
  }

  const parser = detectParser(parse, response);
  if (parser === 'json') {
    return response.json();
  }
  if (parser === 'text') {
    return response.text();
  }
  return response;
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
