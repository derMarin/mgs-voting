import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const SIZES = {
	thumbnail: { width: 150, height: 150 },
	medium: { width: 600, height: 600 },
	large: { width: 1200, height: 1200 }
};

export interface ProcessedImages {
	originalPath: string;
	largePath: string;
	mediumPath: string;
	thumbnailPath: string;
}

function getSupabaseClient() {
	const supabaseUrl = env.SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
	}

	return createClient(supabaseUrl, supabaseKey);
}

async function uploadToSupabase(
	buffer: Buffer,
	filePath: string,
	contentType: string
): Promise<string> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase.storage
		.from('uploads')
		.upload(filePath, buffer, {
			contentType,
			upsert: true
		});

	if (error) {
		throw new Error(`Supabase upload error: ${error.message}`);
	}

	// Get public URL
	const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);

	return urlData.publicUrl;
}

export async function processAndSaveImage(file: File): Promise<ProcessedImages> {
	const fileId = uuidv4();
	const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

	// Convert file to buffer
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	// Determine content type
	const contentType = file.type || 'image/jpeg';

	// Upload original
	const originalFilename = `original/${fileId}.${extension}`;
	const originalPath = await uploadToSupabase(buffer, originalFilename, contentType);

	// Process and upload large version (1200x1200 max)
	const largeBuffer = await sharp(buffer)
		.resize(SIZES.large.width, SIZES.large.height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 85 })
		.toBuffer();

	const largeFilename = `large/${fileId}.webp`;
	const largePath = await uploadToSupabase(largeBuffer, largeFilename, 'image/webp');

	// Process and upload medium version (600x600 max)
	const mediumBuffer = await sharp(buffer)
		.resize(SIZES.medium.width, SIZES.medium.height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 80 })
		.toBuffer();

	const mediumFilename = `medium/${fileId}.webp`;
	const mediumPath = await uploadToSupabase(mediumBuffer, mediumFilename, 'image/webp');

	// Process and upload thumbnail (150x150 cover)
	const thumbnailBuffer = await sharp(buffer)
		.resize(SIZES.thumbnail.width, SIZES.thumbnail.height, {
			fit: 'cover',
			position: 'centre'
		})
		.webp({ quality: 75 })
		.toBuffer();

	const thumbnailFilename = `thumbnails/${fileId}.webp`;
	const thumbnailPath = await uploadToSupabase(thumbnailBuffer, thumbnailFilename, 'image/webp');

	// Return full URLs
	return {
		originalPath,
		largePath,
		mediumPath,
		thumbnailPath
	};
}

export async function deleteImageFiles(imagePaths: ProcessedImages): Promise<void> {
	const supabase = getSupabaseClient();

	// Extract file paths from URLs
	const extractPath = (url: string): string | null => {
		try {
			const urlObj = new URL(url);
			const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/uploads\/(.+)/);
			return pathMatch ? pathMatch[1] : null;
		} catch {
			return null;
		}
	};

	const pathsToDelete = [
		extractPath(imagePaths.originalPath),
		extractPath(imagePaths.largePath),
		extractPath(imagePaths.mediumPath),
		extractPath(imagePaths.thumbnailPath)
	].filter((p): p is string => p !== null);

	if (pathsToDelete.length > 0) {
		const { error } = await supabase.storage.from('uploads').remove(pathsToDelete);
		if (error) {
			console.warn('Error deleting files from Supabase:', error.message);
		}
	}
}

export async function getImageInfo(
	filePath: string
): Promise<{ width: number; height: number; format: string } | null> {
	try {
		// For Supabase URLs, we can't easily get metadata without downloading
		// Return null for now - this function is rarely used
		return null;
	} catch {
		return null;
	}
}
