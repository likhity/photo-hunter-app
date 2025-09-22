import photohunts from '~/data/photohunts.json';

export interface PhotoHunt {
  id: number;
  long: number;
  lat: number;
  name: string;
  description: string;
  hunted: boolean;
  isUserGenerated: boolean;
  createdBy: string;
  referenceImage: string | null;
  createdAt: string;
}

export interface CreatePhotoHuntData {
  name: string;
  description: string;
  lat: number;
  long: number;
  referenceImage: string;
}

class PhotoHuntService {
  private photoHunts: PhotoHunt[] = [...photohunts];
  private nextId = Math.max(...photohunts.map((p) => p.id)) + 1;

  getAllPhotoHunts(): PhotoHunt[] {
    return this.photoHunts;
  }

  getPhotoHuntById(id: number): PhotoHunt | undefined {
    return this.photoHunts.find((p) => p.id === id);
  }

  getUserGeneratedPhotoHunts(): PhotoHunt[] {
    return this.photoHunts.filter((p) => p.isUserGenerated);
  }

  getUserPhotoHunts(userId: string): PhotoHunt[] {
    return this.photoHunts.filter((p) => p.isUserGenerated && p.createdBy === userId);
  }

  createPhotoHunt(data: CreatePhotoHuntData, userId?: string): PhotoHunt {
    const newPhotoHunt: PhotoHunt = {
      id: this.nextId++,
      long: data.long,
      lat: data.lat,
      name: data.name,
      description: data.description,
      hunted: false,
      isUserGenerated: true,
      createdBy: userId || 'current-user', // In a real app, this would be the actual user ID
      referenceImage: data.referenceImage,
      createdAt: new Date().toISOString(),
    };

    this.photoHunts.push(newPhotoHunt);
    return newPhotoHunt;
  }

  markPhotoHuntAsHunted(id: number): boolean {
    const photoHunt = this.photoHunts.find((p) => p.id === id);
    if (photoHunt) {
      photoHunt.hunted = true;
      return true;
    }
    return false;
  }

  deletePhotoHunt(id: number): boolean {
    const index = this.photoHunts.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.photoHunts.splice(index, 1);
      return true;
    }
    return false;
  }

  // In a real app, you would also have methods to:
  // - Save to backend/database
  // - Sync with server
  // - Handle offline storage
  // - Upload reference images to cloud storage
}

export default new PhotoHuntService();
