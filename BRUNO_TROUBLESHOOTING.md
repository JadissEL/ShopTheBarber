# 🔧 Bruno Import Troubleshooting Guide

## 🚨 "Something went wrong" Error - Solutions

If you're getting "Something went wrong" when trying to import the Bruno collection, try these solutions in order:

### 1. **Verify Server is Running**
First, make sure your API server is running:

```bash
npm run dev:full
```

Test the API manually:
```bash
curl http://localhost:3001/health
```

### 2. **Check Bruno Version**
Make sure you have the latest version of Bruno:
- Download from: https://www.usebruno.com/
- Current version should be 1.x or higher

### 3. **Import Method - Step by Step**

#### Method A: Folder Import (Recommended)
1. Open Bruno application
2. Click **"Open Collection"** (not "Import")
3. Navigate to: `C:\Users\Jadiss\Downloads\lebarbier\bruno\`
4. **Select the "bruno" folder** (not individual files)
5. Click "Select Folder"

#### Method B: Drag & Drop
1. Open Bruno application
2. Drag the entire `bruno` folder from File Explorer
3. Drop it into the Bruno window

#### Method C: Manual Import
1. Open Bruno application
2. Click **"Import Collection"**
3. Select the `collection.bru` file
4. Bruno will automatically detect the folder structure

### 4. **Environment Setup**
After importing:
1. Click the environment dropdown (top-right)
2. Select **"Local Development"**
3. Verify the base URL is: `http://localhost:3001`

### 5. **Test Individual Requests**
Start with simple requests:
1. **Health Check**: `GET /health`
2. **Get Barbers**: `GET /api/barbers`
3. **Get Services**: `GET /api/services`

### 6. **Common Issues & Fixes**

#### Issue: "Collection not found"
- Make sure you're selecting the `bruno` folder, not individual files
- Verify the folder contains: `collection.bru`, `environments/`, `requests/`

#### Issue: "Invalid collection format"
- Check that `collection.bru` exists and is readable
- Verify no syntax errors in the collection file

#### Issue: "Environment variables not found"
- Make sure you've selected the "Local Development" environment
- Check that `environments/local.bru` exists

#### Issue: "Server connection failed"
- Verify your server is running on port 3001
- Check firewall settings
- Try `http://127.0.0.1:3001` instead of `localhost`

### 7. **Alternative Import Methods**

#### Method 1: Create New Collection
1. Open Bruno
2. Click "New Collection"
3. Name it "ShopTheBarber API"
4. Copy requests from the `bruno/requests/` folder manually

#### Method 2: Import Individual Requests
1. Open Bruno
2. Create new collection
3. Import individual `.bru` files from `bruno/requests/`

### 8. **Verify Collection Structure**
Your `bruno` folder should contain:
```
bruno/
├── collection.bru          # Main collection file
├── README.md              # Documentation
├── environments/
│   ├── local.bru         # Local development environment
│   └── production.bru    # Production environment
└── requests/
    ├── auth/             # Authentication requests
    ├── barbers/          # Barber-related requests
    ├── services/         # Service requests
    ├── appointments/     # Appointment requests
    ├── favorites/        # Favorites requests
    ├── profile/          # Profile requests
    ├── search/           # Search requests
    └── health/           # Health check
```

### 9. **Manual Collection Creation**
If import still fails, create the collection manually:

1. **Create Collection**:
   - Name: "ShopTheBarber API"
   - Type: HTTP

2. **Add Environment**:
   - Name: "Local Development"
   - Variables:
     - `baseUrl`: `http://localhost:3001`
     - `authToken`: (leave empty, will be set by login)

3. **Add Requests**:
   - Start with: `GET {{baseUrl}}/health`
   - Then add: `GET {{baseUrl}}/api/barbers`
   - Continue with other endpoints

### 10. **Contact Support**
If none of the above works:
1. Check Bruno's GitHub issues: https://github.com/usebruno/bruno
2. Try the Bruno Discord community
3. Verify your Bruno version is up to date

## ✅ Success Checklist

- [ ] Server running on port 3001
- [ ] Health endpoint responds: `curl http://localhost:3001/health`
- [ ] Bruno application opened
- [ ] Collection imported successfully
- [ ] Environment set to "Local Development"
- [ ] First request (Health Check) works
- [ ] Authentication requests work
- [ ] All endpoints accessible

## 🎯 Quick Test Commands

```bash
# Test server
curl http://localhost:3001/health

# Test API endpoints
curl http://localhost:3001/api/barbers
curl http://localhost:3001/api/services

# Test with authentication (if needed)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/profile
```

## 📞 Need Help?

If you're still having issues:
1. Check the terminal output for any error messages
2. Verify all files exist in the `bruno/` folder
3. Try restarting Bruno application
4. Try restarting your development server
5. Check if any antivirus software is blocking the import 