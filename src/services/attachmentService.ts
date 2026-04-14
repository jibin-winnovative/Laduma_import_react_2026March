import { api } from './apiClient';

const BASE_PATH = '/api/Attachments';

export interface Attachment {
  attachmentId: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileUrl: string;
  entityType: string;
  entityId: number;
  category?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface PresignedUploadResponse {
  attachmentId: number;
  uploadUrl: string;
  fileName: string;
}

export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  entityType: string;
  entityId: number;
  category?: string;
  isPublic?: boolean;
}

export interface PresignedDownloadResponse {
  attachmentId: number;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  expiresAt: string;
}

export const attachmentService = {
  requestPresignedUpload: async (request: PresignedUploadRequest): Promise<PresignedUploadResponse> => {
    console.log('📝 Requesting presigned upload:', {
      fileName: request.fileName,
      contentType: request.contentType,
      entityType: request.entityType,
      entityId: request.entityId,
      category: request.category,
      isPublic: request.isPublic,
    });

    const response: any = await api.post(`${BASE_PATH}/presigned-upload`, request);
    const data = response.data?.data || response.data || response;

    console.log('✅ Received presigned upload response:', {
      attachmentId: data.attachmentId,
      fileName: data.fileName,
      uploadUrlDomain: data.uploadUrl?.split('?')[0] || 'N/A',
    });

    return data;
  },

  confirmUpload: async (attachmentId: number): Promise<void> => {
    return api.post(`${BASE_PATH}/${attachmentId}/confirm`, {});
  },

  getByEntity: async (entityType: string, entityId: number): Promise<Attachment[]> => {
    const response: any = await api.get(`${BASE_PATH}/entity/${entityType}/${entityId}`);
    return response.data?.data || response.data || response;
  },

  delete: async (attachmentId: number): Promise<void> => {
    return api.delete(`${BASE_PATH}/${attachmentId}`);
  },

  getDownloadUrl: async (
    attachmentId: number,
    expirationMinutes: number = 60,
    isView: boolean = false
  ): Promise<string> => {
    console.log('📥 Requesting presigned download URL for attachment:', attachmentId, { isView });
    const params = new URLSearchParams();
    params.append('expirationMinutes', expirationMinutes.toString());
    if (isView) {
      params.append('isView', 'true');
    }
    const response: any = await api.get(`${BASE_PATH}/${attachmentId}/presigned-download?${params.toString()}`);
    const downloadData: PresignedDownloadResponse = response.data?.data || response.data || response;
    console.log('✅ Received presigned download URL');
    return downloadData.downloadUrl;
  },

  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    console.log('🔄 Attempting S3 upload via XMLHttpRequest...');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', uploadUrl, true);

      // Set Content-Type header - must match what backend signed
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ S3 upload successful via XMLHttpRequest');
          resolve();
        } else {
          console.error('❌ S3 Upload failed:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
          });
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        console.error('❌ S3 Upload network error:', {
          status: xhr.status,
          statusText: xhr.statusText,
        });
        reject(new Error('Network error during S3 upload'));
      };

      xhr.onabort = () => {
        console.error('❌ S3 Upload aborted');
        reject(new Error('S3 upload was aborted'));
      };

      xhr.send(file);
    });
  },
};
