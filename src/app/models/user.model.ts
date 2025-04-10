export interface User {
    _id: string;
    email: string;
    name: string;
    phone: string;
    merchantId?: any;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    lastSeen?: string;
  }