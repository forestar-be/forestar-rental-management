import {
  MachineRented,
  MachineRentedCreated,
  MachineRentedUpdatedData,
} from './types';

const API_URL = process.env.REACT_APP_API_URL;

const apiRequest = async (
  endpoint: string,
  method: string,
  token: string,
  body?: any,
  additionalHeaders: HeadersInit = { 'Content-Type': 'application/json' },
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
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`${response.statusText} ${response.status}`);
  }

  return await response.json();
};

export const getAllMachineRented = async (token: string) => {
  const response = await apiRequest(
    '/rental-mngt/machine-rented',
    'POST',
    token,
    {
      filter: {},
    },
  );
  return response.data;
};

export const fetchMachineById = async (
  id: string,
  token: string,
): Promise<MachineRented> => {
  const response = await apiRequest(
    `/rental-mngt/machine-rented/${id}`,
    'GET',
    token,
  );
  return response as MachineRented;
};

export const updateMachine = async (
  id: string,
  data: MachineRentedUpdatedData,
  token: string,
) => {
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
  newMachine: MachineRentedCreated,
  token: string,
) => {
  return await apiRequest(
    '/rental-mngt/machine-rented',
    'PUT',
    token,
    newMachine,
  );
};
