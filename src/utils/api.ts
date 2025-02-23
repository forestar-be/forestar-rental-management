import {
  MachineRental,
  MachineRentalToCreate,
  MachineRentalWithMachineRented,
  MachineRented,
  MachineRentedCreated,
  MachineRentedUpdatedData,
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

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`${response.statusText} ${response.status}`);
  }

  return await response.json();
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
) => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/rental`,
    'PUT',
    token,
    rental,
  );
};

export const getAllMachineRental = async (
  token: string,
): Promise<MachineRentalWithMachineRented[]> => {
  return await apiRequest('/rental-mngt/machine-rental', 'GET', token);
};

export const deleteMachineRentalApi = async (id: string, token: string) => {
  await apiRequest(`/rental-mngt/machine-rental/${id}`, 'DELETE', token);
};

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

// New API functions for Maintenance History
export const getMaintenanceHistories = async (
  machineId: string,
  token: string,
): Promise<any[]> => {
  const response = await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/maintenance`,
    'GET',
    token,
  );
  return response;
};

export const addMaintenanceHistory = async (
  machineId: string,
  notes: string,
  token: string,
): Promise<any> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/maintenance`,
    'POST',
    token,
    { notes },
  );
};

export const deleteMaintenanceHistory = async (
  machineId: string,
  maintenanceId: string,
  token: string,
): Promise<any> => {
  return await apiRequest(
    `/rental-mngt/machine-rented/${machineId}/maintenance/${maintenanceId}`,
    'DELETE',
    token,
  );
};
