import {
  ConfigElement,
  MachineRental,
  MachineRentalToCreate,
  MachineRentalWithMachineRented,
  RentalPaymentAmountType,
  MachineRented,
  MachineRentedCreated,
  MachineRentedImage,
  MachineRentedUpdatedData,
  MachineRentedVariant,
  MachineRentedWithImage,
} from './types';

const API_URL = process.env.REACT_APP_API_URL;

const apiRequest = async (
  endpoint: string,
  method: string,
  token: string,
  body?: any,
  additionalHeaders: HeadersInit = { 'Content-Type': 'application/json' },
  stringifyBody: boolean = true,
) => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...additionalHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = stringifyBody ? JSON.stringify(body) : body;
  }

  const response: Response = await fetch(`${API_URL}${endpoint}`, options);

  let data;

  try {
    // Check if the response is a binary type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/html')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }
  } catch (error) {
    console.warn('Error parsing response', response, error);
  }

  if (
    response.status === 403 &&
    data?.message &&
    data?.message === 'jwt expired'
  ) {
    window.location.href = `/login?redirect=${window.location.pathname}`;
  }

  if (
    response.status === 403 &&
    data?.message &&
    data?.message === 're_auth_gg_required'
  ) {
    window.location.href = `/connection-google?redirect=${window.location.pathname}`;
  }

  if (!response.ok) {
    console.error(`${response.statusText} ${response.status}`, data);
    if (typeof data === 'string' && data) {
      throw new Error(data);
    }
    throw new Error(
      data?.message || `${response.statusText} ${response.status}`,
    );
  }

  return data;
};

export const login = async (data: any) => {
  return apiRequest('/rental-mngt/login', 'POST', '', data);
};

export const getAllMachineRented = async (
  token: string,
  withImages = false,
) => {
  const response = await apiRequest(
    '/rental-mngt/machine-rented',
    'POST',
    token,
    {
      filter: {},
      withImages,
    },
  );
  return response.data;
};

export const fetchMachineById = async (
  id: string,
  token: string,
): Promise<MachineRentedWithImage> => {
  const response = await apiRequest(
    `/rental-mngt/machine-rented/${id}`,
    'GET',
    token,
  );
  return response as MachineRentedWithImage;
};

export const updateMachine = async (
  id: string,
  data: MachineRentedUpdatedData,
  token: string,
): Promise<
  MachineRented & { eventUpdateType: 'update' | 'delete' | 'create' | 'none' }
> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${id}`,
    'PATCH',
    token,
    data,
  );
};

export const deleteMachineApi = async (id: string, token: string) => {
  await apiRequest(`/rental-mngt/machine-rented/${id}`, 'DELETE', token);
};

export const addMachineRented = async (
  newMachine: MachineRentedCreated & { image: File },
  token: string,
) => {
  const formData = new FormData();
  Object.keys(newMachine).forEach((key) => {
    formData.append(key, (newMachine as Record<string, any>)[key]);
  });

  return await apiRequest(
    '/rental-mngt/machine-rented',
    'PUT',
    token,
    formData,
    {},
    false,
  );
};

export const updateMachineRentedImage = async (
  id: string,
  image: File,
  token: string,
): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', image);

  return await apiRequest(
    `/rental-mngt/machine-rented/${id}/image`,
    'PATCH',
    token,
    formData,
    {},
    false,
  );
};

export const createMachineRental = async (
  machineId: string,
  rental: MachineRentalToCreate,
  token: string,
): Promise<MachineRental | { errorKey: string; message: string }> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/rental`,
    'PUT',
    token,
    rental,
    undefined,
    undefined,
  );
};

export const getAllMachineRental = async (
  token: string,
): Promise<MachineRentalWithMachineRented[]> => {
  return await apiRequest('/rental-mngt/machine-rental', 'GET', token);
};

export const deleteMachineRentalApi = async (
  id: string,
  token: string,
  body?: { reason?: string; notifyClient?: boolean },
) => {
  return await apiRequest(
    `/rental-mngt/machine-rental/${id}/cancel`,
    'POST',
    token,
    body,
  );
};

export const acceptMachineRental = async (
  id: string,
  token: string,
  data: {
    amountType: RentalPaymentAmountType;
    customAmount?: number;
  },
): Promise<MachineRentalWithMachineRented> =>
  apiRequest(`/rental-mngt/machine-rental/${id}/accept`, 'POST', token, data);

export const markMachineRentalPaid = async (
  id: string,
  token: string,
): Promise<MachineRentalWithMachineRented> =>
  apiRequest(`/rental-mngt/machine-rental/${id}/mark-paid`, 'POST', token);

export const fetchMachineRentalById = async (
  id: string,
  token: string,
): Promise<MachineRentalWithMachineRented> => {
  const response = await apiRequest(
    `/rental-mngt/machine-rental/${id}`,
    'GET',
    token,
  );
  return response as MachineRentalWithMachineRented;
};

export const updateMachineRental = async (
  id: string,
  data: Partial<MachineRental>,
  token: string,
): Promise<MachineRental> => {
  const response = await apiRequest(
    `/rental-mngt/machine-rental/${id}`,
    'PATCH',
    token,
    data,
    undefined,
    undefined,
  );
  return response as MachineRental;
};

export async function getKnownEmails(token: string): Promise<string[]> {
  return await apiRequest('/rental-mngt/known-emails', 'GET', token);
}

export const getAvailableParts = async (
  token: string,
): Promise<{ parts: string[] }> => {
  return await apiRequest('/rental-mngt/machine-rented/parts', 'GET', token);
};

export const getAvailableAddons = async (
  token: string,
): Promise<{ addons: { name: string; price: number; category: string }[] }> => {
  return await apiRequest('/rental-mngt/addons', 'GET', token);
};

export const getAvailableCategories = async (
  token: string,
): Promise<{ categories: string[] }> => {
  return await apiRequest('/rental-mngt/categories', 'GET', token);
};

export const fetchConfig = (token: string) =>
  apiRequest('/rental-mngt/config', 'GET', token);

export const addConfig = (
  token: string,
  config: { key: string; value: string },
) => apiRequest('/rental-mngt/config', 'PUT', token, config);

export const deleteConfig = (token: string, key: string) =>
  apiRequest(`/rental-mngt/config/${key}`, 'DELETE', token);

export const updateConfig = (token: string, configToUpdate: ConfigElement) =>
  apiRequest(
    `/rental-mngt/config/${configToUpdate.key}`,
    'PATCH',
    token,
    configToUpdate,
  );

export const getRentalAgreement = async (
  rentalId: string,
  token: string,
): Promise<Blob> => {
  return await apiRequest(
    `/rental-mngt/machine-rental/${rentalId}/rental-agreement`,
    'GET',
    token,
  );
};

export const isAuthenticatedGg = async (
  token: string,
): Promise<{ isAuthenticated: boolean }> => {
  return await apiRequest('/auth-google/is-authenticated', 'GET', token);
};

export const getAuthUrlGg = async (
  token: string,
  redirectUrl: string,
): Promise<{ url: string; email: string }> => {
  return await apiRequest(
    `/auth-google/url?redirect=${redirectUrl}`,
    'GET',
    token,
  );
};

// ─── Multi-Image API ────────────────────────────────────────────────

export const uploadMachineImages = async (
  machineId: string,
  images: File[],
  token: string,
): Promise<{ images: MachineRentedImage[] }> => {
  const formData = new FormData();
  images.forEach((image) => formData.append('images', image));
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/images`,
    'POST',
    token,
    formData,
    {},
    false,
  );
};

export const deleteMachineImage = async (
  machineId: string,
  imageId: string,
  token: string,
): Promise<void> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/images/${imageId}`,
    'DELETE',
    token,
  );
};

export const reorderMachineImages = async (
  machineId: string,
  order: { imageId: number; position: number }[],
  token: string,
): Promise<void> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/images/reorder`,
    'PATCH',
    token,
    order,
  );
};

// ─── Variant API ────────────────────────────────────────────────────

export const createVariant = async (
  machineId: string,
  data: {
    title: string;
    description?: string;
    categories?: { categoryName: string }[];
    addons?: { addonName: string; state: string }[];
  },
  token: string,
): Promise<MachineRentedVariant> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/variants`,
    'POST',
    token,
    data,
  );
};

export const updateVariant = async (
  machineId: string,
  variantId: string,
  data: {
    title?: string;
    description?: string;
    categories?: { categoryName: string }[];
    addons?: { addonName: string; state: string }[];
    position?: number;
  },
  token: string,
): Promise<MachineRentedVariant> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/variants/${variantId}`,
    'PATCH',
    token,
    data,
  );
};

export const deleteVariant = async (
  machineId: string,
  variantId: string,
  token: string,
): Promise<void> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/variants/${variantId}`,
    'DELETE',
    token,
  );
};

export const uploadVariantImages = async (
  machineId: string,
  variantId: string,
  images: File[],
  token: string,
): Promise<{ images: MachineRentedImage[] }> => {
  const formData = new FormData();
  images.forEach((image) => formData.append('images', image));
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/variants/${variantId}/images`,
    'POST',
    token,
    formData,
    {},
    false,
  );
};

export const deleteVariantImage = async (
  machineId: string,
  variantId: string,
  imageId: string,
  token: string,
): Promise<void> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/variants/${variantId}/images/${imageId}`,
    'DELETE',
    token,
  );
};
