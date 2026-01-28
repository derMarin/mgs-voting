interface UploadResult {
	originalPath: string;
	largePath: string;
	mediumPath: string;
	thumbnailPath: string;
}

async function resizeImage(
	file: File,
	maxWidth: number,
	maxHeight: number,
	quality: number,
	cover: boolean = false
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		img.onload = () => {
			let width = img.width;
			let height = img.height;

			if (cover) {
				// Cover mode: crop to fill
				const ratio = Math.max(maxWidth / width, maxHeight / height);
				const newWidth = width * ratio;
				const newHeight = height * ratio;
				const offsetX = (newWidth - maxWidth) / 2;
				const offsetY = (newHeight - maxHeight) / 2;

				canvas.width = maxWidth;
				canvas.height = maxHeight;
				ctx?.drawImage(img, -offsetX, -offsetY, newWidth, newHeight);
			} else {
				// Fit inside
				if (width > maxWidth || height > maxHeight) {
					const ratio = Math.min(maxWidth / width, maxHeight / height);
					width = width * ratio;
					height = height * ratio;
				}

				canvas.width = width;
				canvas.height = height;
				ctx?.drawImage(img, 0, 0, width, height);
			}

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to create blob'));
					}
				},
				'image/webp',
				quality / 100
			);
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(file);
	});
}

export async function uploadImageToSupabase(file: File): Promise<UploadResult> {
	// 1. Get signed URLs from our API
	const response = await fetch('/api/upload/signed-url', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ contentType: file.type })
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to get upload URL');
	}

	const { signedUrls, publicUrls } = await response.json();

	// 2. Upload original
	const originalResponse = await fetch(signedUrls.original, {
		method: 'PUT',
		headers: { 'Content-Type': file.type },
		body: file
	});

	if (!originalResponse.ok) {
		throw new Error('Failed to upload original image');
	}

	// 3. Create and upload resized versions
	const largeBlob = await resizeImage(file, 1200, 1200, 85);
	const mediumBlob = await resizeImage(file, 600, 600, 80);
	const thumbnailBlob = await resizeImage(file, 150, 150, 75, true);

	await Promise.all([
		fetch(signedUrls.large, {
			method: 'PUT',
			headers: { 'Content-Type': 'image/webp' },
			body: largeBlob
		}),
		fetch(signedUrls.medium, {
			method: 'PUT',
			headers: { 'Content-Type': 'image/webp' },
			body: mediumBlob
		}),
		fetch(signedUrls.thumbnail, {
			method: 'PUT',
			headers: { 'Content-Type': 'image/webp' },
			body: thumbnailBlob
		})
	]);

	return {
		originalPath: publicUrls.original,
		largePath: publicUrls.large,
		mediumPath: publicUrls.medium,
		thumbnailPath: publicUrls.thumbnail
	};
}
