# Bruno API Testing Setup Guide

## 🚀 Why Bruno Instead of Postman?

Bruno is a modern, fast, and lightweight API client that offers several advantages over Postman:

- **Lightning Fast**: Built with Electron, much faster than Postman
- **Git-Friendly**: Collections are stored as files, perfect for version control
- **No Account Required**: Works offline without requiring an account
- **Modern UI**: Clean, intuitive interface
- **Scripting Support**: Powerful scripting capabilities with JavaScript
- **Free & Open Source**: No subscription fees or limitations

## 📦 Installation

### Option 1: Download from Official Website
1. Go to [Bruno App](https://www.usebruno.com/)
2. Download for your platform (Windows, macOS, Linux)
3. Install and launch Bruno

### Option 2: Using Package Manager

#### Windows (Chocolatey)
```bash
choco install bruno
```

#### macOS (Homebrew)
```bash
brew install bruno
```

#### Linux
```bash
# Download and install from the official website
# Or use snap if available
snap install bruno
```

## 🗂️ Project Structure

Your Bruno collection is organized as follows:

```
bruno/
├── collection.bru              # Main collection file
├── environments/
│   ├── local.bru              # Local development environment
│   └── production.bru         # Production environment
└── requests/
    ├── auth/
    │   ├── login.bru          # Login endpoint
    │   └── register.bru       # Register endpoint
    ├── health/
    │   └── status.bru         # Health check
    ├── profile/
    │   ├── get-profile.bru    # Get user profile
    │   └── update-profile.bru # Update user profile
    ├── barbers/
    │   ├── get-all-barbers.bru
    │   └── get-barber-by-id.bru
    └── appointments/
        └── create-appointment.bru
```

## 🚀 Getting Started

### 1. Open Bruno Collection
1. Launch Bruno
2. Click "Open Collection"
3. Navigate to your project's `bruno/` folder
4. Select the folder to open the collection

### 2. Set Up Environment
1. In Bruno, click on the environment dropdown (top right)
2. Select "Local Development" for local testing
3. Update the `baseUrl` if needed (default: `http://localhost:3001`)

### 3. Test Your First Request
1. Start your development server: `npm run dev:full`
2. In Bruno, navigate to `Health Check` request
3. Click "Send" to test the health endpoint
4. You should see a successful response

## 🔐 Authentication Testing

### Step 1: Login
1. Navigate to `auth/login.bru`
2. The request uses environment variables:
   - `{{testEmail}}`: `client@demo.com`
   - `{{testPassword}}`: `demo123`
3. Click "Send"
4. The response script automatically extracts the token and sets `{{authToken}}`

### Step 2: Test Protected Endpoints
1. After login, the `{{authToken}}` variable is automatically set
2. Navigate to any protected endpoint (e.g., `profile/get-profile.bru`)
3. The request automatically includes the Authorization header
4. Click "Send" to test

## 📝 Available Endpoints

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration

### Health
- **GET** `/api/health` - Server health check

### Profile
- **GET** `/api/profile` - Get user profile (authenticated)
- **PUT** `/api/profile` - Update user profile (authenticated)

### Barbers
- **GET** `/api/barbers` - Get all barbers
- **GET** `/api/barbers/:id` - Get specific barber
- **GET** `/api/barbers?location=city` - Filter by location
- **GET** `/api/barbers?services=1,2&locationType=home` - Advanced filtering

### Services
- **GET** `/api/services` - Get all services
- **GET** `/api/services/:id` - Get specific service

### Appointments
- **GET** `/api/appointments` - Get user appointments (authenticated)
- **POST** `/api/appointments` - Create appointment (authenticated)
- **PUT** `/api/appointments/:id/cancel` - Cancel appointment (authenticated)

### Favorites
- **GET** `/api/favorites` - Get user favorites (authenticated)
- **POST** `/api/favorites` - Add to favorites (authenticated)
- **DELETE** `/api/favorites/:id` - Remove from favorites (authenticated)

### Reviews
- **GET** `/api/reviews?barberId=1` - Get reviews by barber
- **POST** `/api/reviews` - Create review (authenticated)

### Search
- **GET** `/api/search?q=query` - Search barbers and services

### Notifications
- **GET** `/api/notifications` - Get notifications (authenticated)
- **PUT** `/api/notifications/:id/read` - Mark as read (authenticated)
- **PUT** `/api/notifications/read-all` - Mark all as read (authenticated)

### Analytics
- **GET** `/api/analytics/overview` - Overview analytics (authenticated)
- **GET** `/api/analytics/client` - Client analytics (authenticated)
- **GET** `/api/analytics/barber` - Barber analytics (authenticated)

### Settings
- **GET** `/api/settings/client` - Get client settings (authenticated)
- **PUT** `/api/settings/client` - Update client settings (authenticated)
- **GET** `/api/settings/barber` - Get barber settings (authenticated)
- **PUT** `/api/settings/barber` - Update barber settings (authenticated)
- **PUT** `/api/settings/change-password` - Change password (authenticated)

## 🔧 Environment Variables

### Local Development
```env
baseUrl: http://localhost:3001
authToken: (auto-set after login)
testEmail: client@demo.com
testPassword: demo123
barberId: 1
serviceId: 1
appointmentId: 1
```

### Production
```env
baseUrl: https://your-backend-domain.com
authToken: (auto-set after login)
testEmail: client@demo.com
testPassword: demo123
barberId: 1
serviceId: 1
appointmentId: 1
```

## 📜 Scripting Examples

### Auto-extract Token from Login
```javascript
> {%
  if (response.status === 200) {
    const responseData = response.body;
    if (responseData.token) {
      bruno.setVar('authToken', responseData.token);
    }
  }
%}
```

### Auto-extract Appointment ID
```javascript
> {%
  if (response.status === 201 || response.status === 200) {
    const responseData = response.body;
    if (responseData.appointmentId) {
      bruno.setVar('appointmentId', responseData.appointmentId);
    }
  }
%}
```

### Validate Response
```javascript
> {%
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  const data = response.body;
  if (!data.user) {
    throw new Error('Response missing user data');
  }
%}
```

## 🧪 Testing Workflows

### Complete User Journey Test
1. **Register** a new user
2. **Login** with the new user
3. **Get Profile** to verify user data
4. **Update Profile** with new information
5. **Get All Barbers** to browse
6. **Create Appointment** with a barber
7. **Get Appointments** to verify booking
8. **Add Barber to Favorites**
9. **Get Favorites** to verify
10. **Create Review** for the appointment

### Admin Testing
1. **Login** as admin user
2. **Get Analytics** data
3. **Get All Users** (if admin endpoint exists)
4. **Get All Barbers** with admin privileges

### Barber Testing
1. **Login** as barber user
2. **Get Barber Analytics**
3. **Update Barber Settings**
4. **Get Appointments** for the barber

## 🔍 Debugging Tips

### 1. Check Environment Variables
- Click on the environment dropdown to see current values
- Use `{{variableName}}` to reference variables in requests

### 2. View Response Details
- Check the response status code
- Examine response headers
- Look at response body for error messages

### 3. Common Issues
- **401 Unauthorized**: Check if `{{authToken}}` is set
- **404 Not Found**: Verify the endpoint URL
- **500 Server Error**: Check server logs

### 4. Network Tab
- Use Bruno's network tab to see request/response details
- Check if CORS headers are present
- Verify request payload format

## 📚 Advanced Features

### 1. Request Chaining
Use scripts to chain requests together:
```javascript
// After login, automatically fetch profile
> {%
  if (response.status === 200) {
    // Set token
    bruno.setVar('authToken', response.body.token);
    
    // Make another request
    const profileResponse = await req.get('/api/profile');
    console.log('Profile:', profileResponse.body);
  }
%}
```

### 2. Data Validation
```javascript
> {%
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'number' },
      email: { type: 'string' },
      firstName: { type: 'string' }
    },
    required: ['id', 'email', 'firstName']
  };
  
  // Validate response against schema
  const isValid = validateSchema(response.body, schema);
  if (!isValid) {
    throw new Error('Invalid response schema');
  }
%}
```

### 3. Performance Testing
```javascript
> {%
  const startTime = Date.now();
  
  // Make multiple requests
  for (let i = 0; i < 10; i++) {
    await req.get('/api/barbers');
  }
  
  const endTime = Date.now();
  console.log(`Average response time: ${(endTime - startTime) / 10}ms`);
%}
```

## 🚀 Integration with CI/CD

### Export Collection
```bash
# Export as JSON (for other tools)
bruno export --format json --output api-tests.json

# Export as Newman collection
bruno export --format newman --output newman-collection.json
```

### Run in CI/CD
```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run tests
bruno run --collection ./bruno --environment local
```

## 🆘 Troubleshooting

### Common Issues:

1. **Collection Not Loading**:
   - Ensure you're opening the `bruno/` folder, not individual files
   - Check that all `.bru` files are properly formatted

2. **Environment Variables Not Working**:
   - Verify variable names match exactly (case-sensitive)
   - Check that environment is selected in Bruno

3. **Authentication Failing**:
   - Ensure server is running (`npm run dev:full`)
   - Check that login request is successful
   - Verify token extraction script is working

4. **CORS Errors**:
   - Check server CORS configuration
   - Ensure `baseUrl` matches server URL exactly

### Getting Help:
- [Bruno Documentation](https://docs.usebruno.com/)
- [Bruno GitHub](https://github.com/usebruno/bruno)
- [Bruno Discord](https://discord.gg/KqXjqGq)

Your ShopTheBarber API is now ready for comprehensive testing with Bruno! 🎉 