import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Organization {
  id: string;
  [key: string]: any;
}

export const createOrganization = async (data: any): Promise<Organization> => {
  return apiRequest(API_ENDPOINTS.ORGANIZATION.CREATE, {
    method: 'POST',
    data,
  });
};

export const listOrganizations = async () => {
  const res = await apiRequest("/api/list/organizations", {
    method: "GET",
  });

  // Normalize backend shape -> always return array
  return res.organizations || [];
};

export const viewOrganization = (id: string) =>
  apiRequest(`/api/view/organization/${id}`, {
    method: "GET",
  });

export const deleteOrganization = async (id: string): Promise<void> => {
  return apiRequest(API_ENDPOINTS.ORGANIZATION.DELETE(id), {
    method: 'DELETE',
  });
};
