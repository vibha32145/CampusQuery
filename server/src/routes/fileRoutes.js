const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const File = require('../models/File');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only PDF and Word documents
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed'), false);
        }
    }
});

// Upload file to Cloudinary
const uploadToCloudinary = (buffer, originalName, mimetype) => {
    return new Promise((resolve, reject) => {
        const resourceType = mimetype === 'application/pdf' ? 'image' : 'raw';
        
        cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: 'campus-query-documents',
                public_id: `${Date.now()}-${originalName.split('.')[0]}`,
                format: mimetype === 'application/pdf' ? 'pdf' : 'auto'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

// POST /api/files/upload - Upload a new file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, mimetype, size, buffer } = req.file;

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(buffer, originalname, mimetype);

        // Determine file format
        let format = 'Unknown';
        if (mimetype === 'application/pdf') {
            format = 'PDF';
        } else if (mimetype === 'application/msword') {
            format = 'DOC';
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            format = 'DOCX';
        }

        // Save file details to MongoDB
        const newFile = new File({
            filename: originalname,
            originalName: originalname,
            mimetype: mimetype,
            size: size,
            cloudinaryUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            format: format,
            status: 'ready'
        });

        const savedFile = await newFile.save();

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                _id: savedFile._id,
                filename: savedFile.filename,
                format: savedFile.format,
                size: savedFile.size,
                status: savedFile.status,
                createdAt: savedFile.createdAt,
                cloudinaryUrl: savedFile.cloudinaryUrl
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        
        if (error.message.includes('Only PDF and Word documents')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ 
            error: 'Failed to upload file',
            details: error.message 
        });
    }
});

// GET /api/files - Get all files
router.get('/', async (req, res) => {
    try {
        const files = await File.find()
            .sort({ createdAt: -1 })
            .select('filename originalName format size status createdAt cloudinaryUrl');

        res.json({
            message: 'Files retrieved successfully',
            files: files
        });

    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve files',
            details: error.message 
        });
    }
});

// GET /api/files/:id - Get a specific file
router.get('/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            message: 'File retrieved successfully',
            file: file
        });

    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve file',
            details: error.message 
        });
    }
});

// DELETE /api/files/:id - Delete a file
router.delete('/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(file.cloudinaryPublicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            // Continue with MongoDB deletion even if Cloudinary fails
        }

        // Delete from MongoDB
        await File.findByIdAndDelete(req.params.id);

        res.json({
            message: 'File deleted successfully',
            deletedFile: {
                _id: file._id,
                filename: file.filename
            }
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ 
            error: 'Failed to delete file',
            details: error.message 
        });
    }
});

// PUT /api/files/:id/status - Update file status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['uploaded', 'processing', 'ready', 'error'];
        
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const file = await File.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            message: 'File status updated successfully',
            file: file
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ 
            error: 'Failed to update file status',
            details: error.message 
        });
    }
});

module.exports = router;
