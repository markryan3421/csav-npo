<?php

namespace App\Services;

use App\Models\Sdg;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SdgService
{
    /**
     * Create a new SDG.
     *
     * @param array $data  Validated data (name, description, cover_photo)
     * @return Sdg
     */
    public function createSdg(array $data, int $userId): Sdg
    {
        // Handle file upload
        $coverPhoto = $data['cover_photo'] ?? null;
        $coverPhotoPath = $this->uploadCoverPhoto($coverPhoto);

        // Create the SDG
        $sdg = Sdg::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'cover_photo' => $coverPhotoPath ?? 'default-cover.jpg',
        ]);

        $sdg->save();
        // Attach the authenticated user
        $sdg->users()->attach($userId, [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $sdg;
    }

    public function updateSdg(Sdg $sdg, array $data): Sdg
    {
        if ($sdg->cover_photo && $sdg->cover_photo !== 'default-cover.jpg') {
            Storage::disk('public')->delete($sdg->cover_photo);
        }

        // Handle file upload
        $coverPhoto = $data['cover_photo'] ?? null;
        $coverPhotoPath = $this->uploadCoverPhoto($coverPhoto);

        // Update the SDG
        $sdg->update([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'cover_photo' => $coverPhotoPath ?? $sdg->cover_photo,
        ]);

        return $sdg;
    }

    /**
     * Upload cover photo and return its path.
     *
     * @param UploadedFile|null $file
     * @return string|null
     */
    protected function uploadCoverPhoto(?UploadedFile $file): ?string
    {
        if (!$file) {
            return null;
        }

        return $file->store('sdg', 'public');
    }
}
