import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Session {
  id: string;
  status?: string;
  [key: string]: any;
}

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

export const getSessionItems = async (sessionId: string): Promise<any[]> => {
  return apiRequest(API_ENDPOINTS.SESSION_ITEM.LIST_BY_SESSION(sessionId), {
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
