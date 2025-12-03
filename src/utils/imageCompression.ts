
/**
 * Compresses and resizes an image file using the browser's Canvas API.
 * 
 * @param file - The original image file.
 * @param maxWidth - The maximum width of the output image (default: 800px).
 * @param quality - The JPEG quality from 0 to 1 (default: 0.8).
 * @returns A Promise that resolves to the compressed File object.
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 800,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve, reject) => {
        // 1. Create an image element to load the file
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = (err) => reject(err);

        img.onload = () => {
            // 2. Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            // 3. Create canvas and draw image
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // 4. Export as compressed JPEG
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Image compression failed"));
                        return;
                    }
                    // Create a new File object with the same name but .jpg extension
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const compressedFile = new File([blob], newName, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = (err) => reject(err);

        // Start reading the file
        reader.readAsDataURL(file);
    });
};
