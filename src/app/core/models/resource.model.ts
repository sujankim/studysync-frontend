import { UserResponse } from './auth.model';

export interface ResourceResponse {
  id: number;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string;
  fileSize: number | null; // bytes
  originalFileName: string | null;
  roomId: number;
  uploadedBy: UserResponse;
  createdAt: string;
}

// The 5 resource types matching our backend enum
export type ResourceType = 'PDF' | 'IMAGE' | 'VIDEO' | 'LINK' | 'DOCUMENT';

// Filter options for the resources tab
export type ResourceFilter = 'ALL' | 'PDF' | 'IMAGE' | 'VIDEO' | 'LINK' | 'DOCUMENT';

// What we send when adding a link
export interface AddLinkRequest {
  title: string;
  description?: string;
  url: string;
}

// Icons + colors for each resource type
export const RESOURCE_TYPE_CONFIG: Record<
  ResourceType,
  {
    icon: string;
    color: string;
    label: string;
  }
> = {
  PDF: { icon: 'picture_as_pdf', color: '#ef4444', label: 'PDF' },
  IMAGE: { icon: 'image', color: '#06b6d4', label: 'Image' },
  VIDEO: { icon: 'play_circle', color: '#8b5cf6', label: 'Video' },
  LINK: { icon: 'link', color: '#10b981', label: 'Link' },
  DOCUMENT: { icon: 'description', color: '#f59e0b', label: 'Document' },
};

// Convert bytes to human-readable string
// 1024 → "1 KB"   1048576 → "1 MB"
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
