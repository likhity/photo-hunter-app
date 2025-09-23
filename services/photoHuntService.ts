import apiClient from './apiClient';

import { API_CONFIG } from '~/config/api';
import {
  PhotoHunt,
  PhotoHuntCreateRequest,
  PhotoHuntListParams,
  PhotoHuntCompletion,
  PhotoSubmissionRequest,
  PhotoSubmissionResponse,
  NearbyPhotoHuntsRequest,
} from '~/types/api';

export interface CreatePhotoHuntData {
  name: string;
  description: string;
  lat: number;
  long: number;
  referenceImage?:
    | string
    | {
        uri: string;
        type: string;
        name: string;
      };
}

class PhotoHuntService {
  // Get all PhotoHunts with optional filtering
  async getAllPhotoHunts(params?: PhotoHuntListParams): Promise<PhotoHunt[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.LIST,
        params
      );
      return response?.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch PhotoHunts');
    }
  }

  // Get PhotoHunt by ID
  async getPhotoHuntById(id: string): Promise<PhotoHunt> {
    try {
      const response = await apiClient.get<PhotoHunt>(API_CONFIG.ENDPOINTS.PHOTOHUNTS.DETAIL(id));
      if (response.data) {
        return response.data;
      }
      throw new Error('PhotoHunt not found');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch PhotoHunt');
    }
  }

  // Get user-generated PhotoHunts
  async getUserGeneratedPhotoHunts(): Promise<PhotoHunt[]> {
    return this.getAllPhotoHunts({ user_generated: true });
  }

  // Get PhotoHunts created by current user
  async getUserPhotoHunts(): Promise<PhotoHunt[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.MY
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching user PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch user PhotoHunts');
    }
  }

  // Create new PhotoHunt
  async createPhotoHunt(data: CreatePhotoHuntData): Promise<PhotoHunt> {
    try {
      // Check if referenceImage is a file object (for multipart upload) or string (for URL)
      const isFileObject =
        data.referenceImage &&
        typeof data.referenceImage === 'object' &&
        'uri' in data.referenceImage;

      if (isFileObject) {
        // Use multipart form data for file upload
        const file = data.referenceImage as { uri: string; type: string; name: string };

        console.log('Creating PhotoHunt with file upload:', {
          name: data.name,
          description: data.description,
          lat: data.lat,
          long: data.long,
          file: {
            uri: file.uri,
            type: file.type,
            name: file.name,
          },
          endpoint: API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
        });

        const response = await apiClient.uploadFile<PhotoHunt>(
          API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
          file,
          {
            name: data.name,
            description: data.description,
            lat: data.lat,
            long: data.long,
          }
        );

        if (response.data) {
          return response.data;
        }
        throw new Error('Failed to create PhotoHunt');
      } else {
        // Use JSON for URL-based reference image
        const requestData: PhotoHuntCreateRequest = {
          name: data.name,
          description: data.description,
          latitude: data.lat,
          longitude: data.long,
          reference_image: data.referenceImage as string,
        };

        // Log the request data being sent
        console.log('Creating PhotoHunt with data:', {
          name: requestData.name,
          description: requestData.description,
          latitude: requestData.latitude,
          longitude: requestData.longitude,
          reference_image: requestData.reference_image ? 'Present' : 'Not provided',
          endpoint: API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
        });

        // Pretty print the full request data
        console.log('Pretty printed request data:', JSON.stringify(requestData, null, 2));

        const response = await apiClient.post<PhotoHunt>(
          API_CONFIG.ENDPOINTS.PHOTOHUNTS.CREATE,
          requestData
        );
        if (response.data) {
          return response.data;
        }
        throw new Error('Failed to create PhotoHunt');
      }
    } catch (error: any) {
      // Enhanced error logging for photo hunt creation
      console.error('PhotoHunt creation failed:', {
        error: error.message,
        status: error.status,
        details: error.details,
        requestData: {
          name: data.name,
          description: data.description,
          lat: data.lat,
          long: data.long,
          referenceImage: data.referenceImage ? 'Present' : 'Not provided',
        },
      });

      // Pretty print the error details and request data
      console.error('Pretty printed error details:', JSON.stringify(error.details, null, 2));
      console.error(
        'Pretty printed request data:',
        JSON.stringify(
          {
            name: data.name,
            description: data.description,
            lat: data.lat,
            long: data.long,
            referenceImage: data.referenceImage,
          },
          null,
          2
        )
      );
      throw new Error(error.message || 'Failed to create PhotoHunt');
    }
  }

  // Update PhotoHunt
  async updatePhotoHunt(id: string, data: Partial<CreatePhotoHuntData>): Promise<PhotoHunt> {
    try {
      const requestData: Partial<PhotoHuntCreateRequest> = {};

      if (data.name) requestData.name = data.name;
      if (data.description) requestData.description = data.description;
      if (data.lat !== undefined) requestData.latitude = data.lat;
      if (data.long !== undefined) requestData.longitude = data.long;
      if (data.referenceImage !== undefined) requestData.reference_image = data.referenceImage;

      const response = await apiClient.patch<PhotoHunt>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.UPDATE(id),
        requestData
      );
      if (response.data) {
        return response.data;
      }
      throw new Error('Failed to update PhotoHunt');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update PhotoHunt');
    }
  }

  // Delete PhotoHunt
  async deletePhotoHunt(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.PHOTOHUNTS.DELETE(id));
      return true;
    } catch (error: any) {
      console.error('Error deleting PhotoHunt:', error);
      throw new Error(error.message || 'Failed to delete PhotoHunt');
    }
  }

  // Get nearby PhotoHunts
  async getNearbyPhotoHunts(lat: number, lng: number, radius?: number): Promise<PhotoHunt[]> {
    try {
      const params: NearbyPhotoHuntsRequest = { lat, lng };
      if (radius) params.radius = radius;

      const response = await apiClient.get<{ results: PhotoHunt[] }>(
        API_CONFIG.ENDPOINTS.PHOTOHUNTS.NEARBY,
        params
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching nearby PhotoHunts:', error);
      throw new Error(error.message || 'Failed to fetch nearby PhotoHunts');
    }
  }

  // Submit photo for validation
  async submitPhoto(photohuntId: string, imageUrl: string): Promise<PhotoSubmissionResponse> {
    try {
      const requestData: PhotoSubmissionRequest = {
        photohunt_id: photohuntId,
        image_url: imageUrl,
      };

      const response = await apiClient.post<PhotoSubmissionResponse>(
        API_CONFIG.ENDPOINTS.PHOTOS.SUBMIT,
        requestData
      );
      if (response.data) {
        return response.data;
      }
      throw new Error('Failed to submit photo');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit photo');
    }
  }

  // Get user's PhotoHunt completions
  async getUserCompletions(): Promise<PhotoHuntCompletion[]> {
    try {
      const response = await apiClient.get<{ results: PhotoHuntCompletion[] }>(
        API_CONFIG.ENDPOINTS.COMPLETIONS.LIST
      );
      return response.data?.results || [];
    } catch (error: any) {
      console.error('Error fetching completions:', error);
      throw new Error(error.message || 'Failed to fetch completions');
    }
  }

  // Upload image to S3 (if you have an upload endpoint)
  async uploadImage(imageUri: string, type: string = 'image/jpeg'): Promise<string> {
    try {
      const response = await apiClient.uploadFile<{ url: string }>('/upload/', {
        uri: imageUri,
        type,
        name: `photo_${Date.now()}.jpg`,
      });

      if (response.data?.url) {
        return response.data.url;
      }
      throw new Error('Failed to upload image');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload image');
    }
  }
}

export default new PhotoHuntService();
