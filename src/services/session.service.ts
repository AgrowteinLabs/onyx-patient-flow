import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Session {
  id: string;
  status?: string;
  [key: string]: any;
}

export const createSession = async (data: any): Promise<Session> => {
  return apiRequest(API_ENDPOINTS.SESSION.CREATE, {
    method: 'POST',
    data,
  });
};

export const getSessions = async (status?: string): Promise<Session[]> => {
  const params = status ? { status } : {};
  return apiRequest(API_ENDPOINTS.SESSION.GET_ALL, {
    method: 'GET',
    params,
  });
};

export const listSessions = async (status?: string): Promise<Session[]> => {
  const params = status ? { status } : {};
  return apiRequest(API_ENDPOINTS.SESSION.GET_ALL, {
    method: 'GET',
    params,
  });
};

export const viewSession = async (id: string): Promise<Session> => {
  return apiRequest(API_ENDPOINTS.SESSION.VIEW(id), {
    method: 'GET',
  });
};

export const updateSession = async (id: string, data: any): Promise<Session> => {
  return apiRequest(API_ENDPOINTS.SESSION.UPDATE(id), {
    method: 'PUT',
    data,
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  return apiRequest(API_ENDPOINTS.SESSION.DELETE(id), {
    method: 'DELETE',
  });
};

export const addSessionItemResult = async (data: any): Promise<any> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.ADD_RESULT, {
    method: 'POST',
    data,
  });
};

export const addSessionItemMedia = async (formData: FormData): Promise<any> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.ADD_MEDIA, {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getSessionItemMedia = async (id: string, fileKey: string): Promise<Blob> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.GET_MEDIA(id, fileKey), {
    method: 'GET',
    responseType: 'blob',
  });
};

export const getSessionItems = async (sessionId: string): Promise<any[]> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.LIST_BY_SESSION(sessionId), {
    method: 'GET',
  });
};

export const getSessionItemDetails = async (id: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.VIEW(id), {
    method: 'GET',
  });
};

export const getSessionItemViewUrls = async (id: string): Promise<{ urls: Record<string, string> }> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.VIEW_URLS(id), {
    method: 'GET',
  });
};

export const getSessionItemMediaList = async (id: string): Promise<any[]> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.LIST_MEDIA(id), {
    method: 'GET',
  });
};
