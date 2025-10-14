import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import * as ImagePicker from 'expo-image-picker';
import { fileStorageService } from '@/lib/services/fileStorageService';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
}

export function ImageUploader({ onImageUploaded, currentImage }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const fileName = `image_${Date.now()}.jpg`;
      const fileUrl = await fileStorageService.uploadFile(blob, fileName, 'image/jpeg');
      
      onImageUploaded(fileUrl);
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={pickImage} disabled={uploading}>
      <View style={{ padding: 20, borderWidth: 1, borderRadius: 8 }}>
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={{ width: 100, height: 100 }} />
        ) : (
          <ThemedText>{uploading ? 'Uploading...' : 'Select Image'}</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}