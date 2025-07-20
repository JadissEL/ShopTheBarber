# ShopTheBarber API - Bruno Collection

This Bruno collection contains all the API endpoints for testing the ShopTheBarber application.

## 🚀 Quick Start

1. **Install Bruno**: Download from [usebruno.com](https://www.usebruno.com/)
2. **Open Collection**: In Bruno, click "Open Collection" and select this `bruno/` folder
3. **Set Environment**: Select "Local Development" environment
4. **Start Server**: Run `npm run dev:full` in your project
5. **Test Health**: Run the "Health Check" request to verify connection

## 📁 Collection Structure

```
bruno/
├── README.md                    # This file
├── collection.bru              # Main collection overview
├── environments/
│   ├── local.bru              # Local development environment
│   └── production.bru         # Production environment
└── requests/
    ├── auth/                  # Authentication endpoints
    │   ├── login.bru
    │   └── register.bru
    ├── health/                # Health check
    │   └── status.bru
    ├── profile/               # User profile management
    │   ├── get-profile.bru
    │   └── update-profile.bru
    ├── barbers/               # Barber-related endpoints
    │   ├── get-all-barbers.bru
    │   └── get-barber-by-id.bru
    ├── services/              # Service endpoints
    │   ├── get-all-services.bru
    │   └── get-service-by-id.bru
    ├── appointments/          # Appointment management
    │   ├── create-appointment.bru
    │   ├── get-appointments.bru
    │   └── cancel-appointment.bru
    ├── favorites/             # Favorites management
    │   ├── get-favorites.bru
    │   └── add-favorite.bru
    └── search/                # Search functionality
        └── search.bru
```

## 🔐 Authentication Flow

1. **Login**: Use `auth/login.bru` with demo credentials
   - Email: `client@demo.com`
   - Password: `demo123`
2. **Token Auto-Extraction**: The login request automatically extracts the token
3. **Protected Requests**: All subsequent requests use the extracted token

## 🧪 Testing Workflows

### Basic User Flow
1. Health Check → Verify server is running
2. Login → Get authentication token
3. Get Profile → Verify user data
4. Get All Barbers → Browse available barbers
5. Get All Services → Browse available services
6. Create Appointment → Book a service
7. Get Appointments → Verify booking

### Advanced Testing
- **Filtering**: Test barber filtering by location and services
- **Search**: Test search functionality
- **Favorites**: Add/remove barbers from favorites
- **Profile Updates**: Test profile modification

## 🔧 Environment Variables

### Local Development
- `baseUrl`: `http://localhost:3001`
- `authToken`: Auto-set after login
- `testEmail`: `client@demo.com`
- `testPassword`: `demo123`
- `barberId`: `1`
- `serviceId`: `1`
- `appointmentId`: `1`

### Production
- `baseUrl`: `https://your-backend-domain.com`
- Other variables remain the same

## 📝 Request Examples

### Login Request
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "{{testEmail}}",
  "password": "{{testPassword}}"
}
```

### Create Appointment
```http
POST {{baseUrl}}/api/appointments
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "barberId": {{barberId}},
  "services": [{{serviceId}}],
  "date": "2024-01-15",
  "time": "14:00",
  "locationType": "shop",
  "address": "123 Barber Street",
  "notes": "First time visit"
}
```

## 🎯 Tips for Testing

1. **Start with Health Check**: Always verify the server is running first
2. **Use Environment Variables**: Leverage `{{variableName}}` for dynamic values
3. **Check Response Scripts**: Some requests auto-extract data for subsequent requests
4. **Test Error Cases**: Try invalid credentials, missing fields, etc.
5. **Verify Status Codes**: Ensure responses match expected HTTP status codes

## 🚨 Common Issues

- **401 Unauthorized**: Check if `{{authToken}}` is set (run login first)
- **404 Not Found**: Verify the endpoint URL and server is running
- **500 Server Error**: Check server logs for detailed error information
- **CORS Errors**: Ensure `baseUrl` matches your server URL exactly

## 📚 Additional Resources

- [Bruno Documentation](https://docs.usebruno.com/)
- [ShopTheBarber API Documentation](../README.md)
- [Firebase Setup Guide](../FIREBASE_SETUP.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

Happy testing! 🎉 