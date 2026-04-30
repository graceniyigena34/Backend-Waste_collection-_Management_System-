# Waste Collector Complete Registration Guide

## Overview
The waste collector registration system is designed as a **ONE-TIME COMPLETE REGISTRATION**. Collectors register once with all their information at once, and their complete profile is immediately created with all role-specific data.

---

## Registration Flow

### 1. **Initial Registration (One-Time)**

A waste collector registers with all information in a single request.

**Endpoint:** `POST /api/waste-collectors/register`

#### Request Body Example - Driver

```json
{
  "user_id": 1,
  "company_id": 1,
  "employee_id": "WC001",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+250788123456",
  "role": "driver",
  "identification_type": "national_id",
  "identification_number": "1234567890123",
  "date_of_birth": "1990-05-15",
  "address": "Kigali, Rwanda",
  "hire_date": "2024-01-15",
  "salary": 50000,
  "contract_type": "full_time",
  "vehicle_id": 1,
  "assigned_zone_id": 5,
  
  "license_type": "B",
  "license_number": "LIC123456",
  "license_expiry": "2026-05-15",
  "vehicle_registration": "RAJ-001",
  "driving_experience_years": 5
}
```

#### Request Body Example - Manager

```json
{
  "user_id": 2,
  "company_id": 1,
  "employee_id": "WM001",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+250788654321",
  "role": "manager",
  "identification_type": "national_id",
  "identification_number": "9876543210123",
  "date_of_birth": "1985-08-20",
  "address": "Kigali, Rwanda",
  "hire_date": "2023-06-10",
  "salary": 75000,
  "contract_type": "full_time",
  "assigned_zone_id": 5,
  
  "manages_team": true,
  "team_size": 5,
  "supervisor_id": 3,
  "department": "Operations",
  "qualifications": "BS in Operations Management"
}
```

---

### 2. **Registration Response - Complete Profile**

**Status Code:** `201 Created`

```json
{
  "message": "Collector registered successfully with complete profile",
  "collector": {
    "id": 1,
    "user_id": 1,
    "company_id": 1,
    "employee_id": "WC001",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+250788123456",
    "role": "driver",
    "status": "active",
    "verification_status": "pending",
    "identification_type": "national_id",
    "identification_number": "1234567890123",
    "date_of_birth": "1990-05-15T00:00:00.000Z",
    "address": "Kigali, Rwanda",
    "assigned_zone_id": 5,
    "performance_rating": 0,
    "total_collections": 0,
    "active_routes": 0,
    "hire_date": "2024-01-15T00:00:00.000Z",
    "salary": 50000,
    "contract_type": "full_time",
    "vehicle_id": 1,
    "documents_verified": false,
    "created_at": "2024-02-01T10:30:00.000Z",
    "updated_at": "2024-02-01T10:30:00.000Z",
    "roleData": {
      "id": 1,
      "collector_id": 1,
      "license_type": "B",
      "license_number": "LIC123456",
      "license_expiry": "2026-05-15T00:00:00.000Z",
      "vehicle_registration": "RAJ-001",
      "driving_experience_years": 5,
      "created_at": "2024-02-01T10:30:00.000Z",
      "updated_at": "2024-02-01T10:30:00.000Z"
    }
  }
}
```

---

## After Registration

### 3. **View Complete Profile**

**No need to register again!** Just retrieve the profile:

**Endpoint:** `GET /api/waste-collectors/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** Returns the same complete profile with role-specific data

---

### 4. **Retrieve Specific Profile Data**

#### Get Driver's Information
```
GET /api/waste-collectors/drivers/{id}
```

#### Get Manager's Information
```
GET /api/waste-collectors/managers/{id}
```

#### Get Complete Profile with Performance & Assignments
```
GET /api/waste-collectors/{id}/complete-info
```

---

## Required Fields by Role

### Common Required Fields (All Roles)
- `user_id` - From auth system
- `company_id` - Waste collection company
- `employee_id` - Unique employee ID
- `full_name`
- `email`
- `phone`
- `hire_date`
- `contract_type`
- `role` - One of: `driver`, `manager`, `supervisor`

### Driver-Specific Required Fields
- `license_type` - A, B, C, D, or E
- `license_number`
- `license_expiry` - Date when license expires

### Manager-Specific Required Fields
- `department` - Department name

### Optional Fields
- `identification_type`
- `identification_number`
- `date_of_birth`
- `address`
- `salary`
- `vehicle_id`
- `assigned_zone_id`
- For drivers: `vehicle_registration`, `driving_experience_years`
- For managers: `manages_team`, `team_size`, `supervisor_id`, `qualifications`

---

## Frontend Integration Example

### Registration Form

```html
<!-- Basic Info -->
<input type="text" name="full_name" placeholder="Full Name" required>
<input type="email" name="email" placeholder="Email" required>
<input type="text" name="phone" placeholder="Phone" required>
<input type="text" name="employee_id" placeholder="Employee ID" required>
<select name="role" required>
  <option value="driver">Driver</option>
  <option value="manager">Manager</option>
  <option value="supervisor">Supervisor</option>
</select>

<!-- Conditional Fields Based on Role -->

<!-- If Role = Driver -->
<select name="license_type" required>
  <option value="A">Category A</option>
  <option value="B">Category B</option>
  <option value="C">Category C</option>
  <option value="D">Category D</option>
  <option value="E">Category E</option>
</select>
<input type="text" name="license_number" placeholder="License Number" required>
<input type="date" name="license_expiry" required>
<input type="text" name="vehicle_registration" placeholder="Vehicle Registration">

<!-- If Role = Manager -->
<input type="text" name="department" placeholder="Department" required>
<input type="checkbox" name="manages_team"> Manages Team
<input type="number" name="team_size" placeholder="Team Size">
<input type="text" name="qualifications" placeholder="Qualifications">
```

### Registration API Call (JavaScript)

```javascript
async function registerWasteCollector() {
  const formData = {
    // Common fields
    user_id: 1,
    company_id: 1,
    employee_id: "WC001",
    full_name: "John Doe",
    email: "john@example.com",
    phone: "+250788123456",
    role: "driver",
    hire_date: "2024-01-15",
    contract_type: "full_time",
    
    // Driver-specific
    license_type: "B",
    license_number: "LIC123456",
    license_expiry: "2026-05-15",
    vehicle_registration: "RAJ-001",
    driving_experience_years: 5
  };

  const response = await fetch('/api/waste-collectors/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Registration successful!', data.collector);
    // Store the complete profile
    sessionStorage.setItem('collector', JSON.stringify(data.collector));
  } else {
    const error = await response.json();
    console.error('Registration failed:', error.message);
  }
}
```

### View Profile (No Re-registration)

```javascript
async function viewMyProfile() {
  const response = await fetch('/api/waste-collectors/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const profile = await response.json();
  console.log('My Complete Profile:', profile);
  console.log('Role-specific data:', profile.roleData);
}
```

---

## Database Structure

### Registration Data Flow

```
Registration Request
    ↓
Create waste_collectors entry
    ↓
If role = driver → Create collector_drivers entry
If role = manager → Create collector_managers entry
    ↓
Return complete profile with roleData
```

### Database Tables Involved

1. **waste_collectors** - Base profile
2. **collector_drivers** - Driver-specific (if role = driver)
3. **collector_managers** - Manager-specific (if role = manager)

---

## Error Scenarios

### 1. Missing Role-Specific Fields (Driver)

**Request:** Register as driver without license info

**Response:**
```json
{
  "message": "Driver role requires license_type, license_number, and license_expiry"
}
```

### 2. Missing Role-Specific Fields (Manager)

**Request:** Register as manager without department

**Response:**
```json
{
  "message": "Manager role requires department"
}
```

### 3. Duplicate Employee ID

**Request:** Register with existing employee_id

**Response:**
```json
{
  "message": "Employee ID already registered"
}
```

---

## Summary

✅ **One-time registration** - All data collected at once
✅ **Complete profile** - Base + role-specific data stored immediately
✅ **No re-registration** - Just view profile after registration
✅ **Role-specific validation** - Ensures required data for each role
✅ **Immediate data availability** - All information ready to use

Users register once and their complete profile is immediately available for all operations (assignments, performance tracking, team management, etc.).
