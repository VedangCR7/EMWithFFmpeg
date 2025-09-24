# FFmpeg Library Copy Scripts Usage Guide

## 📋 Available Scripts

### 1. **PowerShell Version** (Windows)
- **File:** `copy_ffmpeg_libraries.ps1`
- **Usage:** For Windows PowerShell environments
- **Features:** Colored output, automatic backup, comprehensive logging

### 2. **Bash Version** (Linux/WSL/macOS)
- **File:** `copy_ffmpeg_libraries.sh`
- **Usage:** For Linux, WSL, or macOS environments
- **Features:** Cross-platform compatibility, same functionality as PowerShell version

## 🚀 How to Use

### **Step 1: Extract the Package**
```bash
unzip ffmpegkit-final-package.zip
```

### **Step 2: Navigate to Your Project**
```bash
cd /path/to/your/EventMarketersProject
```

### **Step 3: Copy FFmpegKit Integration**
```bash
# Copy the integration directory to your project
cp -r ffmpeg-kit-integration ./
```

### **Step 4: Run the Copy Script**

#### **For Windows PowerShell:**
```powershell
.\copy_ffmpeg_libraries.ps1
```

#### **For Linux/WSL/macOS:**
```bash
chmod +x copy_ffmpeg_libraries.sh
./copy_ffmpeg_libraries.sh
```

## 📁 What the Scripts Do

### **1. Safety Checks**
- ✅ Verifies integration directory exists
- ✅ Verifies main project jniLibs directory exists
- ✅ Creates automatic backup of existing libraries

### **2. Library Copying**
- 📋 Copies all `.so` files from integration to main project
- 🔄 Preserves existing `libffmpegkit*.so` files
- 📊 Updates all architectures (arm64-v8a, armeabi-v7a, x86, x86_64)

### **3. Verification**
- 📈 Shows library count per architecture
- ✅ Confirms successful copying
- 🎯 Provides next steps for testing

## 🎬 Expected Output

```
🔄 Copying integrated FFmpeg libraries to main project...
=======================================================
📁 Creating backup of current libraries...
✅ Backup created: jniLibs_backup_20250922_150900
📋 Copying integrated libraries to main project...
✅ Copied libavcodec.so to arm64-v8a
✅ Copied libavformat.so to arm64-v8a
✅ Copied libavfilter.so to arm64-v8a
✅ Copied libavutil.so to arm64-v8a
✅ Copied libswscale.so to arm64-v8a
✅ Copied libswresample.so to arm64-v8a
✅ Copied libavdevice.so to arm64-v8a
✅ Restored libffmpegkit.so to arm64-v8a
📊 arm64-v8a: 8 total libraries
... (similar for other architectures)

==========================================
LIBRARY COPY COMPLETED SUCCESSFULLY!
==========================================

✅ New FFmpeg libraries copied to main project
✅ FFmpegKit wrapper libraries preserved
✅ All architectures updated

🚀 Next steps:
1. Clean and rebuild your Android project:
   cd android && ./gradlew clean && cd ..
2. Run your React Native app:
   npx react-native run-android
3. Test video processing functionality

🎯 The drawtext filter should now work!
==========================================
```

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. "ffmpeg-kit-integration directory not found"**
- **Solution:** Make sure you copied the integration directory to your project
- **Check:** `ls -la ffmpeg-kit-integration/`

#### **2. "Main project jniLibs directory not found"**
- **Solution:** Run the script from your React Native project root
- **Check:** `ls -la android/app/src/main/jniLibs/`

#### **3. Permission Denied (Linux/macOS)**
- **Solution:** Make the script executable
- **Command:** `chmod +x copy_ffmpeg_libraries.sh`

#### **4. Execution Policy Error (Windows)**
- **Solution:** Allow script execution
- **Command:** `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 📊 What You Get After Running

### **New Capabilities:**
- 🎥 **Advanced Video Processing** - All FFmpeg filters and codecs
- 📝 **Text Overlay** - drawtext filter with custom fonts
- 🖼️ **Image Overlay** - PNG, JPEG, TIFF, WebP support
- 🌍 **Multi-language** - RTL language support
- 🎨 **Visual Effects** - Blur, crop, resize, color correction
- 🎵 **Audio Processing** - Advanced audio filters and conversion

### **Architecture Support:**
- **arm64-v8a** - Modern 64-bit ARM devices
- **armeabi-v7a** - Older 32-bit ARM devices
- **x86** - 32-bit Intel emulators
- **x86_64** - 64-bit Intel emulators

## ✅ Success Indicators

After running the script successfully, you should see:
- ✅ All architectures updated with new libraries
- ✅ Backup created for safety
- ✅ FFmpegKit wrapper libraries preserved
- ✅ Library counts displayed for each architecture

## 🎯 Testing Your Integration

### **1. Clean Build**
```bash
cd android && ./gradlew clean && cd ..
```

### **2. Run App**
```bash
npx react-native run-android
```

### **3. Test Features**
- Try video processing operations
- Test text overlay functionality
- Verify all video formats work
- Check audio processing capabilities

## 🆘 Support

If you encounter issues:
1. Check the script output for specific error messages
2. Verify all required directories exist
3. Ensure proper file permissions
4. Check that you're running from the correct directory

---

**Scripts Created:** September 22, 2025  
**Compatibility:** Windows PowerShell & Linux/WSL/macOS  
**Status:** ✅ Ready for Production Use
