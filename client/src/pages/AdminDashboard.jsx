import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getFiles, deleteFile, uploadFile } from '../services/mockApi';
import FileList from '../components/FileList';
import UploadDropzone from '../components/UploadDropzone';

const AdminDashboard = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const data = await getFiles();
      setFiles(data);
    } catch (error) {
      toast.error('Failed to fetch files');
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(id);
        setFiles(files.filter(file => file._id !== id));
        toast.success('File deleted successfully');
      } catch (error) {
        toast.error('Failed to delete file');
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const uploadedFile = await uploadFile(file);
      setFiles([uploadedFile, ...files]);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Error uploading file:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your documents and files for CampusQuery</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Files</h2>
        <UploadDropzone onDrop={handleUpload} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Uploaded Files</h2>
        <FileList 
          files={files} 
          isLoading={isLoading} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
