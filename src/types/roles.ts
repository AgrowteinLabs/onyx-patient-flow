export type UserRole = 
  | 'super-admin'
  | 'executive-admin'
  | 'cluster-head'
  | 'user-head'
  | 'nurse'
  | 'technician'
  | 'user'
  | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
