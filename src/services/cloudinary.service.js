import cloudinary from "../config/cloudinary.js";

const uploadImage = async (buffer) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            uploadStream.end(buffer);
        }
        )
    } catch (err) {
        console.log("Error uploading image to Cloudinary:", err);
    }
};

const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw error;
    }
}

export { uploadImage, deleteImage };