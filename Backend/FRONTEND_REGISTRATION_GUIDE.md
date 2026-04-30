# Frontend Registration Implementation Guide

## Quick Reference

### Single Registration Endpoint

**URL:** `POST http://localhost:5000/api/waste-collectors/register`

**No need for multiple endpoints!** Collectors register once with all their information.

---

## Multi-Step Form Implementation

### Step 1: Basic Information (Common to All Roles)

```
- Full Name (required)
- Email (required)
- Phone (required)
- Employee ID (required)
- Date of Birth
- Address
- Identification Type (national_id, passport, etc.)
- Identification Number
```

### Step 2: Role Selection

```
Select Role (required):
□ Driver
□ Manager
□ Supervisor
```

### Step 3: Employment Information

```
- Hire Date (required)
- Contract Type (required): full_time, part_time, contract
- Salary
- Assigned Zone ID
- Vehicle ID
```

### Step 4: Role-Specific Information

**IF DRIVER:**
```
- License Type (required): A, B, C, D, E
- License Number (required)
- License Expiry (required)
- Vehicle Registration
- Years of Driving Experience
```

**IF MANAGER:**
```
- Department (required)
- Does Manager Manage Team? (checkbox)
  - If YES: Team Size (required if checked)
- Supervisor ID
- Qualifications
```

---

## Form Logic (JavaScript/React)

### State Management Example

```javascript
const [formData, setFormData] = useState({
  // Step 1: Basic Info
  full_name: '',
  email: '',
  phone: '',
  employee_id: '',
  date_of_birth: '',
  address: '',
  identification_type: '',
  identification_number: '',
  
  // Step 2: Role
  role: '',
  
  // Step 3: Employment
  hire_date: '',
  contract_type: '',
  salary: '',
  assigned_zone_id: '',
  vehicle_id: '',
  
  // Step 4: Role-Specific
  // Driver
  license_type: '',
  license_number: '',
  license_expiry: '',
  vehicle_registration: '',
  driving_experience_years: '',
  
  // Manager
  department: '',
  manages_team: false,
  team_size: '',
  supervisor_id: '',
  qualifications: ''
});

// Company and User IDs would come from auth context
const [companyId] = useState(1); // Get from logged-in company
const [userId] = useState(1);     // Get from logged-in user
```

### Conditional Field Rendering

```javascript
function renderRoleSpecificFields() {
  if (formData.role === 'driver') {
    return (
      <>
        <input type="select" name="license_type" 
               options={['A', 'B', 'C', 'D', 'E']} required />
        <input type="text" name="license_number" required />
        <input type="date" name="license_expiry" required />
        <input type="text" name="vehicle_registration" />
        <input type="number" name="driving_experience_years" />
      </>
    );
  } else if (formData.role === 'manager') {
    return (
      <>
        <input type="text" name="department" required />
        <input type="checkbox" name="manages_team" />
        {formData.manages_team && (
          <input type="number" name="team_size" required />
        )}
        <input type="number" name="supervisor_id" />
        <input type="text" name="qualifications" />
      </>
    );
  }
}
```

### Validation Before Submission

```javascript
function validateForm() {
  const errors = [];
  
  // Common validation
  if (!formData.full_name) errors.push('Full name required');
  if (!formData.email) errors.push('Email required');
  if (!formData.phone) errors.push('Phone required');
  if (!formData.employee_id) errors.push('Employee ID required');
  if (!formData.role) errors.push('Role required');
  if (!formData.hire_date) errors.push('Hire date required');
  if (!formData.contract_type) errors.push('Contract type required');
  
  // Driver validation
  if (formData.role === 'driver') {
    if (!formData.license_type) errors.push('License type required for drivers');
    if (!formData.license_number) errors.push('License number required for drivers');
    if (!formData.license_expiry) errors.push('License expiry required for drivers');
  }
  
  // Manager validation
  if (formData.role === 'manager') {
    if (!formData.department) errors.push('Department required for managers');
    if (formData.manages_team && !formData.team_size) 
      errors.push('Team size required when managing team');
  }
  
  return errors;
}
```

### Submit Handler

```javascript
async function handleSubmit(e) {
  e.preventDefault();
  
  // Validate
  const errors = validateForm();
  if (errors.length > 0) {
    setErrorMessages(errors);
    return;
  }
  
  try {
    const payload = {
      // Required for all
      user_id: userId,
      company_id: companyId,
      employee_id: formData.employee_id,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      hire_date: formData.hire_date,
      contract_type: formData.contract_type,
      
      // Optional common
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      identification_type: formData.identification_type || null,
      identification_number: formData.identification_number || null,
      salary: formData.salary ? parseInt(formData.salary) : null,
      assigned_zone_id: formData.assigned_zone_id ? parseInt(formData.assigned_zone_id) : null,
      vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
      
      // Role-specific for driver
      ...(formData.role === 'driver' && {
        license_type: formData.license_type,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry,
        vehicle_registration: formData.vehicle_registration || null,
        driving_experience_years: formData.driving_experience_years ? 
          parseInt(formData.driving_experience_years) : null
      }),
      
      // Role-specific for manager
      ...(formData.role === 'manager' && {
        department: formData.department,
        manages_team: formData.manages_team,
        team_size: formData.manages_team && formData.team_size ? 
          parseInt(formData.team_size) : null,
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null,
        qualifications: formData.qualifications || null
      })
    };
    
    const response = await fetch('/api/waste-collectors/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Registration successful!', data.collector);
      
      // Store complete profile
      localStorage.setItem('collectorProfile', JSON.stringify(data.collector));
      
      // Redirect to dashboard
      navigate('/waste-collector-dashboard');
    } else {
      const error = await response.json();
      setErrorMessages([error.message]);
    }
  } catch (error) {
    setErrorMessages(['Registration failed: ' + error.message]);
  }
}
```

---

## Response After Registration

```json
{
  "message": "Collector registered successfully with complete profile",
  "collector": {
    "id": 1,
    "full_name": "John Doe",
    "role": "driver",
    "status": "active",
    "verification_status": "pending",
    // ... all profile fields
    "roleData": {
      "license_type": "B",
      "license_number": "LIC123456",
      "license_expiry": "2026-05-15T00:00:00.000Z",
      "vehicle_registration": "RAJ-001",
      "driving_experience_years": 5
      // ... all driver-specific fields
    }
  }
}
```

---

## No Re-registration Needed!

### Get Profile Any Time

```javascript
async function fetchMyProfile() {
  const response = await fetch('/api/waste-collectors/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const profile = await response.json();
  console.log('Complete profile:', profile);
  console.log('Role data:', profile.roleData);
}
```

---

## Common Error Messages

| Error | Meaning | Fix |
|-------|---------|-----|
| "Driver role requires license_type, license_number, and license_expiry" | Missing driver fields | Fill all driver fields if role=driver |
| "Manager role requires department" | Missing manager fields | Fill department if role=manager |
| "Employee ID already registered" | Duplicate employee ID | Use unique employee ID |
| "Invalid role" | Role not recognized | Use: driver, manager, or supervisor |

---

## Testing

### Test Driver Registration

```bash
curl -X POST http://localhost:5000/api/waste-collectors/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "company_id": 1,
    "employee_id": "WC001",
    "full_name": "John Driver",
    "email": "john@example.com",
    "phone": "+250788123456",
    "role": "driver",
    "hire_date": "2024-01-15",
    "contract_type": "full_time",
    "license_type": "B",
    "license_number": "LIC123",
    "license_expiry": "2026-05-15"
  }'
```

### Test Manager Registration

```bash
curl -X POST http://localhost:5000/api/waste-collectors/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "company_id": 1,
    "employee_id": "WM001",
    "full_name": "Jane Manager",
    "email": "jane@example.com",
    "phone": "+250788654321",
    "role": "manager",
    "hire_date": "2023-06-10",
    "contract_type": "full_time",
    "department": "Operations",
    "manages_team": true,
    "team_size": 5
  }'
```

---

## Summary

✅ **Single registration endpoint** - No multiple steps needed
✅ **All data collected at once** - Complete profile created immediately
✅ **Conditional fields** - Show/hide based on selected role
✅ **Validation before submit** - Ensure all required fields present
✅ **Role-specific data** - Returned in `roleData` object
✅ **No re-registration** - Profile stays after initial registration
