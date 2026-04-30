# Waste Collector API Documentation

## Overview
This API provides comprehensive waste collector management functionality for waste collection companies. It includes registration, profile management, status tracking, performance monitoring, route assignments, and verification workflows.

---

## Table of Contents
1. [Authentication & Registration](#authentication--registration)
2. [Profile Management](#profile-management)
3. [Status Management](#status-management)
4. [Verification Management](#verification-management)
5. [Performance Tracking](#performance-tracking)
6. [Route Assignments](#route-assignments)
7. [Company Management](#company-management)
8. [Search & Filter](#search--filter)

---

## Authentication & Registration

### Register a New Waste Collector
**POST** `/api/waste-collectors/register`

**Request Body:**
```json
{
  "user_id": 1,
  "company_id": 1,
  "employee_id": "WC001",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+250788123456",
  "identification_type": "national_id",
  "identification_number": "1234567890123",
  "date_of_birth": "1990-05-15",
  "address": "Kigali, Rwanda",
  "hire_date": "2024-01-15",
  "salary": 50000,
  "contract_type": "full_time",
  "vehicle_id": 1,
  "assigned_zone_id": 5
}
```

**Response (201):**
```json
{
  "message": "Collector registered successfully",
  "collector": {
    "id": 1,
    "user_id": 1,
    "company_id": 1,
    "employee_id": "WC001",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+250788123456",
    "status": "active",
    "verification_status": "pending",
    "performance_rating": 0,
    "total_collections": 0,
    "active_routes": 0,
    ...
  }
}
```

---

## Profile Management

### Get My Collector Profile
**GET** `/api/waste-collectors/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "employee_id": "WC001",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+250788123456",
  "status": "active",
  "verification_status": "pending",
  "performance_rating": 4.5,
  "total_collections": 152,
  "active_routes": 3,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Update My Profile
**PUT** `/api/waste-collectors/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "phone": "+250788987654",
  "address": "Kigali, Rwanda",
  "assigned_zone_id": 6
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "collector": { ... }
}
```

### Get Collector Profile by ID
**GET** `/api/waste-collectors/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):** Returns collector profile object

### Update Collector Profile (Admin)
**PUT** `/api/waste-collectors/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "phone": "+250788987654",
  "salary": 55000
}
```

**Response (200):** Returns updated collector

### Remove Collector (Admin)
**DELETE** `/api/waste-collectors/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reason": "Resigned from position"
}
```

**Response (200):**
```json
{
  "message": "Collector removed successfully"
}
```

---

## Status Management

### Mark as On-Duty
**POST** `/api/waste-collectors/status/on-duty`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Marked as on-duty",
  "collector": { ... }
}
```

### Mark as Off-Duty
**POST** `/api/waste-collectors/status/off-duty`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Marked as off-duty",
  "collector": { ... }
}
```

### Change Collector Status (Admin)
**PUT** `/api/waste-collectors/{id}/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Performance issues"
}
```

**Status Options:** `active`, `inactive`, `on_duty`, `off_duty`, `suspended`

**Response (200):** Returns updated collector

### Suspend Collector (Admin)
**POST** `/api/waste-collectors/{id}/suspend`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reason": "Violation of company policy"
}
```

**Response (200):**
```json
{
  "message": "Collector suspended successfully",
  "collector": { ... }
}
```

---

## Verification Management

### Verify Collector Documents (Admin)
**POST** `/api/waste-collectors/{id}/verify`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "verified"
}
```

**Verification Status Options:** `verified`, `rejected`, `pending`

**Response (200):**
```json
{
  "message": "Collector verification status updated to verified",
  "collector": { ... }
}
```

---

## Performance Tracking

### Get Collector Performance Metrics
**GET** `/api/waste-collectors/{id}/performance`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "collector_id": 1,
    "month": "2024-01",
    "total_collections": 45,
    "successful_collections": 44,
    "failed_collections": 1,
    "average_time_per_collection": 12.5,
    "customer_rating": 4.7,
    "completion_rate": 97.8,
    "on_time_rate": 96.0,
    "total_weight_collected": 2850.5
  },
  ...
]
```

### Update Collector Performance Metrics
**PUT** `/api/waste-collectors/{id}/performance`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "month": "2024-02",
  "successful_collections": 48,
  "failed_collections": 2,
  "average_time_per_collection": 11.8,
  "customer_rating": 4.8,
  "completion_rate": 96.0,
  "on_time_rate": 98.5,
  "total_weight_collected": 3100.75
}
```

**Response (200):**
```json
{
  "message": "Performance metrics updated",
  "metrics": { ... }
}
```

### Get Top Performing Collectors
**GET** `/api/waste-collectors/company/{company_id}/top-performers`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `month` (required): Format `YYYY-MM`

**Response (200):**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "total_collections": 152,
    "completion_rate": 98.0,
    "customer_rating": 4.8,
    "on_time_rate": 99.0
  },
  ...
]
```

---

## Route Assignments

### Assign Route to Collector
**POST** `/api/waste-collectors/assignments`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "collector_id": 1,
  "route_id": 5,
  "schedule_id": 12,
  "assignment_date": "2024-02-15",
  "collection_count": 25,
  "waste_collected_kg": 0,
  "notes": "Standard morning route"
}
```

**Response (201):**
```json
{
  "message": "Route assigned successfully",
  "assignment": {
    "id": 1,
    "collector_id": 1,
    "route_id": 5,
    "schedule_id": 12,
    "assignment_date": "2024-02-15T00:00:00Z",
    "status": "assigned",
    "collection_count": 25,
    "waste_collected_kg": 0,
    "start_time": null,
    "end_time": null,
    "notes": "Standard morning route"
  }
}
```

### Get My Assignments
**GET** `/api/waste-collectors/my-assignments`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "collector_id": 1,
    "route_id": 5,
    "schedule_id": 12,
    "assignment_date": "2024-02-15T00:00:00Z",
    "status": "completed",
    "collection_count": 25,
    "waste_collected_kg": 1850.5,
    "start_time": "2024-02-15T06:00:00Z",
    "end_time": "2024-02-15T14:30:00Z",
    "notes": "Standard morning route"
  },
  ...
]
```

### Get Assignments by Date
**GET** `/api/waste-collectors/{id}/assignments`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `date` (required): Format `YYYY-MM-DD`

**Response (200):** Array of assignments for that date

### Update Assignment Status
**PUT** `/api/waste-collectors/assignments/{assignment_id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "completed",
  "collection_count": 25,
  "waste_collected_kg": 1850.5,
  "end_time": "2024-02-15T14:30:00Z",
  "notes": "Route completed successfully"
}
```

**Status Options:** `assigned`, `in_progress`, `completed`, `cancelled`

**Response (200):**
```json
{
  "message": "Assignment updated successfully",
  "assignment": { ... }
}
```

---

## Company Management

### Get All Collectors for Company
**GET** `/api/waste-collectors/company/{company_id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: Filter by collector status (`active`, `inactive`, `on_duty`, `off_duty`, `suspended`)
- `zone_id`: Filter by assigned zone
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "count": 5,
  "collectors": [
    {
      "id": 1,
      "full_name": "John Doe",
      "status": "active",
      "verification_status": "verified",
      "performance_rating": 4.8,
      ...
    },
    ...
  ]
}
```

### Get Collector Statistics
**GET** `/api/waste-collectors/company/{company_id}/stats`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `start_date` (required): Format `YYYY-MM-DD`
- `end_date` (required): Format `YYYY-MM-DD`

**Response (200):**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "total_assignments": 20,
    "completed_assignments": 19,
    "total_collections": 450,
    "total_waste_kg": 28500.75,
    "avg_waste_per_assignment": 1500.04
  },
  ...
]
```

---

## Search & Filter

### Search Collectors
**GET** `/api/waste-collectors/company/{company_id}/search`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `query`: Search by name, email, phone, or employee ID
- `status`: Filter by status
- `verification_status`: Filter by verification status

**Response (200):**
```json
{
  "count": 3,
  "collectors": [ ... ]
}
```

---

## Data Models

### WasteCollector
```typescript
{
  id: number;
  user_id: number;
  company_id: number;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on_duty" | "off_duty" | "suspended";
  verification_status: "pending" | "verified" | "rejected";
  identification_type: string;
  identification_number: string;
  date_of_birth: Date;
  address: string;
  assigned_zone_id?: number;
  performance_rating?: number;
  total_collections: number;
  active_routes: number;
  hire_date: Date;
  salary: number;
  contract_type: string;
  vehicle_id?: number;
  documents_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### CollectorPerformance
```typescript
{
  id: number;
  collector_id: number;
  total_collections: number;
  successful_collections: number;
  failed_collections: number;
  average_time_per_collection: number;
  customer_rating: number;
  completion_rate: number;
  on_time_rate: number;
  total_weight_collected: number;
  month: string; // YYYY-MM
  created_at: Date;
}
```

### CollectorAssignment
```typescript
{
  id: number;
  collector_id: number;
  route_id: number;
  schedule_id: number;
  assignment_date: Date;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  collection_count: number;
  waste_collected_kg: number;
  start_time?: Date;
  end_time?: Date;
  notes?: string;
  created_at: Date;
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "message": "Error description",
  "error": "Additional error details (if available)"
}
```

**Common Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate employee ID)
- `500 Internal Server Error` - Server error

---

## Authentication

All endpoints (except registration) require JWT token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

---

## Features Summary

✅ Complete waste collector CRUD operations
✅ Status tracking (active, inactive, on_duty, off_duty, suspended)
✅ Document verification workflow
✅ Performance metrics tracking
✅ Route assignment and scheduling
✅ Company-level management
✅ Search and filtering capabilities
✅ Statistical analysis and reporting
✅ Top performer identification
✅ Comprehensive error handling
✅ JWT authentication & authorization
