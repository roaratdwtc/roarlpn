<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load Database and Master Admin configuration
require_once 'config.php';

// Connect to MySQL
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed. Please verify MySQL credentials in config.php."]);
    exit();
}

// Create database if not exists
$conn->query("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
$conn->select_db(DB_NAME);

// Setup / Initialize tables if they do not exist
$tables = [
    "companies" => "CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        domain VARCHAR(255) DEFAULT '',
        logo TEXT DEFAULT NULL,
        whatsapp VARCHAR(100) DEFAULT '',
        address VARCHAR(255) DEFAULT '',
        contactPerson VARCHAR(255) DEFAULT '',
        bankAccountName VARCHAR(255) DEFAULT '',
        bankName VARCHAR(255) DEFAULT '',
        bankAccountNumber VARCHAR(100) DEFAULT '',
        bankIban VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'active',
        features VARCHAR(500) DEFAULT '{\"ai_assistant\":true,\"whatsapp_agent\":true,\"finance_ledger\":true,\"partners_portal\":true,\"coupons\":true}',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "bookings" => "CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(100) PRIMARY KEY,
        customerName VARCHAR(255),
        whatsapp VARCHAR(100),
        partnerId VARCHAR(100),
        date VARCHAR(50),
        packageName VARCHAR(255),
        pickupLocation VARCHAR(255),
        roomNo VARCHAR(100),
        pickupTime VARCHAR(100),
        pax INT,
        price DECIMAL(10,2),
        driverId VARCHAR(100),
        status VARCHAR(50),
        addonName VARCHAR(255) DEFAULT '',
        addonPrice DECIMAL(10,2) DEFAULT 0.00,
        calendar_event_id VARCHAR(255) DEFAULT '',
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "drivers" => "CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        whatsapp VARCHAR(100),
        carPlate VARCHAR(100),
        regDate VARCHAR(50),
        defaultSalary DECIMAL(10,2) DEFAULT 100,
        defaultFuel DECIMAL(10,2) DEFAULT 150,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "expenses" => "CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(100) PRIMARY KEY,
        driverId VARCHAR(100),
        bookingId VARCHAR(100) DEFAULT '',
        date VARCHAR(50),
        salary DECIMAL(10,2) DEFAULT 0.00,
        carPetrol DECIMAL(10,2) DEFAULT 0.00,
        campUse DECIMAL(10,2) DEFAULT 0.00,
        misc DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "partners" => "CREATE TABLE IF NOT EXISTS partners (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        commissionRate DECIMAL(5,2),
        address VARCHAR(255),
        contactPerson VARCHAR(255),
        whatsapp VARCHAR(100),
        email VARCHAR(255),
        packages TEXT,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "cars" => "CREATE TABLE IF NOT EXISTS cars (
        id VARCHAR(100) PRIMARY KEY,
        plateNo VARCHAR(100) DEFAULT '',
        bank VARCHAR(100) DEFAULT '',
        brand VARCHAR(255) DEFAULT '',
        model VARCHAR(100) DEFAULT '',
        owner VARCHAR(255) DEFAULT '',
        whatsapp VARCHAR(100) DEFAULT '',
        installment DECIMAL(10,2) DEFAULT 0.00,
        deferment VARCHAR(100) DEFAULT '',
        instDate INT DEFAULT 15,
        currentValue DECIMAL(10,2) DEFAULT 0.00,
        regDate VARCHAR(50) DEFAULT '',
        expDate VARCHAR(50) DEFAULT '',
        insCompany VARCHAR(255) DEFAULT '',
        policyNo VARCHAR(255) DEFAULT '',
        insExp VARCHAR(50) DEFAULT '',
        color VARCHAR(100) DEFAULT '',
        chassisNo VARCHAR(100) DEFAULT '',
        passengers INT DEFAULT 7,
        ledger TEXT,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "packages" => "CREATE TABLE IF NOT EXISTS packages (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(255),
        rate DECIMAL(10,2) DEFAULT 0.00,
        peakRate DECIMAL(10,2) DEFAULT 0.00,
        offpeakRate DECIMAL(10,2) DEFAULT 0.00,
        type VARCHAR(50) DEFAULT 'per_person',
        campUse DECIMAL(10,2) DEFAULT 0.00,
        quadbikeExpense DECIMAL(10,2) DEFAULT 0.00,
        addons TEXT,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "coupons" => "CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(100),
        packageId VARCHAR(100),
        customPrice DECIMAL(10,2) DEFAULT 0.00,
        isActive INT DEFAULT 1,
        startDate VARCHAR(50) DEFAULT NULL,
        endDate VARCHAR(50) DEFAULT NULL,
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "customers" => "CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        whatsapp VARCHAR(100),
        email VARCHAR(255),
        company_id VARCHAR(100) DEFAULT 'roar'
    )",
    "settings" => "CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100),
        setting_value VARCHAR(255),
        company_id VARCHAR(100) DEFAULT 'roar',
        PRIMARY KEY (setting_key, company_id)
    )"
];

foreach ($tables as $name => $query) {
    if (!$conn->query($query)) {
        // If settings fails due to changing PK structure, handle dropping PK first
        if ($name === 'settings') {
            @$conn->query("ALTER TABLE settings DROP PRIMARY KEY");
            if ($conn->query($query)) continue;
        }
        echo json_encode(["status" => "error", "message" => "Failed to create table $name: " . $conn->error]);
        exit();
    }
}

// Seed default company if table is empty
$companies_check = $conn->query("SELECT id FROM companies LIMIT 1");
if ($companies_check && $companies_check->num_rows == 0) {
    $conn->query("INSERT INTO companies (id, name, slug, email, password, whatsapp, address, contactPerson, status) VALUES (
        'roar',
        'Roar Adventure Tourism LLC',
        'roar',
        'info@roaradventuretourism.com',
        'R4roar!786*',
        '+97145578679',
        'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
        'Mr. Abid Ali',
        'active'
    )");
}

// Alter tables to add company_id column if not exists
$tables_to_partition = ['bookings', 'drivers', 'expenses', 'partners', 'cars', 'packages', 'coupons', 'customers'];
foreach ($tables_to_partition as $tbl) {
    $colCheck = $conn->query("SHOW COLUMNS FROM $tbl LIKE 'company_id'");
    if ($colCheck && $colCheck->num_rows == 0) {
        $conn->query("ALTER TABLE $tbl ADD COLUMN company_id VARCHAR(100) DEFAULT 'roar'");
    }
}

// Add features column to companies if not exists
$colCheckFeatures = $conn->query("SHOW COLUMNS FROM companies LIKE 'features'");
if ($colCheckFeatures && $colCheckFeatures->num_rows == 0) {
    $conn->query("ALTER TABLE companies ADD COLUMN features VARCHAR(500) DEFAULT '{\"ai_assistant\":true,\"whatsapp_agent\":true,\"finance_ledger\":true,\"partners_portal\":true,\"coupons\":true}'");
}

// Ensure settings company_id column exists and composite PK is applied
$colCheckSettings = $conn->query("SHOW COLUMNS FROM settings LIKE 'company_id'");
if ($colCheckSettings && $colCheckSettings->num_rows == 0) {
    @$conn->query("ALTER TABLE settings DROP PRIMARY KEY");
    $conn->query("ALTER TABLE settings ADD COLUMN company_id VARCHAR(100) DEFAULT 'roar'");
    $conn->query("ALTER TABLE settings ADD PRIMARY KEY (setting_key, company_id)");
}

$conn->query("INSERT IGNORE INTO settings (setting_key, setting_value, company_id) VALUES ('show_coupons', '1', 'roar')");

// Auto-run schema upgrades for existing tables
$colCheck1 = $conn->query("SHOW COLUMNS FROM bookings LIKE 'addonName'");
if ($colCheck1 && $colCheck1->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN addonName VARCHAR(255) DEFAULT ''");
}
$colCheck2 = $conn->query("SHOW COLUMNS FROM bookings LIKE 'addonPrice'");
if ($colCheck2 && $colCheck2->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN addonPrice DECIMAL(10,2) DEFAULT 0.00");
}

$colCheckCoupon = $conn->query("SHOW COLUMNS FROM bookings LIKE 'couponCode'");
if ($colCheckCoupon && $colCheckCoupon->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN couponCode VARCHAR(100) DEFAULT ''");
}

$colCheckPricingType = $conn->query("SHOW COLUMNS FROM bookings LIKE 'pricingType'");
if ($colCheckPricingType && $colCheckPricingType->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN pricingType VARCHAR(50) DEFAULT 'peak'");
}

$colCheckCalendar = $conn->query("SHOW COLUMNS FROM bookings LIKE 'calendar_event_id'");
if ($colCheckCalendar && $colCheckCalendar->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN calendar_event_id VARCHAR(255) DEFAULT ''");
}

$colCheckCpnStart = $conn->query("SHOW COLUMNS FROM coupons LIKE 'startDate'");
if ($colCheckCpnStart && $colCheckCpnStart->num_rows == 0) {
    $conn->query("ALTER TABLE coupons ADD COLUMN startDate VARCHAR(50) DEFAULT NULL");
}

$colCheckCpnEnd = $conn->query("SHOW COLUMNS FROM coupons LIKE 'endDate'");
if ($colCheckCpnEnd && $colCheckCpnEnd->num_rows == 0) {
    $conn->query("ALTER TABLE coupons ADD COLUMN endDate VARCHAR(50) DEFAULT NULL");
}

$colCheckExpenses = $conn->query("SHOW COLUMNS FROM expenses LIKE 'salary'");
if ($colCheckExpenses && $colCheckExpenses->num_rows == 0) {
    $conn->query("ALTER TABLE expenses ADD COLUMN bookingId VARCHAR(100) DEFAULT ''");
    $conn->query("ALTER TABLE expenses ADD COLUMN salary DECIMAL(10,2) DEFAULT 0.00");
    $conn->query("ALTER TABLE expenses ADD COLUMN carPetrol DECIMAL(10,2) DEFAULT 0.00");
    $conn->query("ALTER TABLE expenses ADD COLUMN campUse DECIMAL(10,2) DEFAULT 0.00");
    $conn->query("ALTER TABLE expenses ADD COLUMN misc DECIMAL(10,2) DEFAULT 0.00");
    $conn->query("ALTER TABLE expenses ADD COLUMN notes TEXT");
}

$colCheckCars = $conn->query("SHOW COLUMNS FROM cars LIKE 'plateNo'");
if ($colCheckCars && $colCheckCars->num_rows == 0) {
    $conn->query("DROP TABLE IF EXISTS cars");
    $conn->query("CREATE TABLE cars (
        id VARCHAR(100) PRIMARY KEY,
        plateNo VARCHAR(100) DEFAULT '',
        bank VARCHAR(100) DEFAULT '',
        brand VARCHAR(255) DEFAULT '',
        model VARCHAR(100) DEFAULT '',
        owner VARCHAR(255) DEFAULT '',
        whatsapp VARCHAR(100) DEFAULT '',
        installment DECIMAL(10,2) DEFAULT 0.00,
        deferment VARCHAR(100) DEFAULT '',
        instDate INT DEFAULT 15,
        currentValue DECIMAL(10,2) DEFAULT 0.00,
        regDate VARCHAR(50) DEFAULT '',
        expDate VARCHAR(50) DEFAULT '',
        insCompany VARCHAR(255) DEFAULT '',
        policyNo VARCHAR(255) DEFAULT '',
        insExp VARCHAR(50) DEFAULT '',
        color VARCHAR(100) DEFAULT '',
        chassisNo VARCHAR(100) DEFAULT '',
        passengers INT DEFAULT 7,
        ledger TEXT
    )");
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. LOGIN ACTION
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';
    
    if (strtolower($email) === strtolower(MASTER_ADMIN_EMAIL) && $password === MASTER_ADMIN_PASS) {
        echo json_encode(["status" => "success", "role" => "master_admin", "user" => ["email" => $email]]);
    } else {
        $email_esc = $conn->real_escape_string($email);
        $pass_esc = $conn->real_escape_string($password);
        $res = $conn->query("SELECT * FROM companies WHERE email = '$email_esc' AND password = '$pass_esc'");
        if ($res && $res->num_rows > 0) {
            $company = $res->fetch_assoc();
            if ($company['status'] !== 'active') {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "This company account has been suspended. Please contact platform support."]);
                exit();
            }
            echo json_encode([
                "status" => "success",
                "role" => "company_admin",
                "company_id" => $company['id'],
                "user" => ["email" => $email],
                "company" => $company
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid email or security password."]);
        }
    }
    exit();
}

// 1.5 ONBOARD ACTION
if ($action === 'onboard') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = isset($input['name']) ? trim($input['name']) : '';
    $slug = isset($input['slug']) ? trim($input['slug']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';
    
    if (!$name || !$slug || !$email || !$password) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields for onboarding."]);
        exit();
    }
    
    $name_esc = $conn->real_escape_string($name);
    $slug_esc = strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '', $slug));
    $email_esc = $conn->real_escape_string($email);
    $password_esc = $conn->real_escape_string($password);
    $whatsapp = $conn->real_escape_string($input['whatsapp'] ?? '');
    $address = $conn->real_escape_string($input['address'] ?? '');
    $contactPerson = $conn->real_escape_string($input['contactPerson'] ?? '');
    $bankAccountName = $conn->real_escape_string($input['bankAccountName'] ?? '');
    $bankName = $conn->real_escape_string($input['bankName'] ?? '');
    $bankAccountNumber = $conn->real_escape_string($input['bankAccountNumber'] ?? '');
    $bankIban = $conn->real_escape_string($input['bankIban'] ?? '');
    $logo = $conn->real_escape_string($input['logo'] ?? '');
    
    // Check if slug or email exists
    $dup_check = $conn->query("SELECT id FROM companies WHERE slug = '$slug_esc' OR email = '$email_esc'");
    if ($dup_check && $dup_check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "A company with this email or subdomain slug already exists."]);
        exit();
    }
    
    $comp_id = 'comp_' . uniqid();
    $features = $conn->real_escape_string($input['features'] ?? '{"ai_assistant":true,"whatsapp_agent":true,"finance_ledger":true,"partners_portal":true,"coupons":true}');
    $sql = "INSERT INTO companies (id, name, slug, email, password, whatsapp, address, contactPerson, bankAccountName, bankName, bankAccountNumber, bankIban, logo, status, features) 
            VALUES ('$comp_id', '$name_esc', '$slug_esc', '$email_esc', '$password_esc', '$whatsapp', '$address', '$contactPerson', '$bankAccountName', '$bankName', '$bankAccountNumber', '$bankIban', '$logo', 'active', '$features')";
            
    if ($conn->query($sql)) {
        // Seed default packages for the new company
        $conn->query("INSERT INTO packages (id, name, category, rate, peakRate, offpeakRate, type, campUse, company_id) VALUES 
            ('pkg_morning_" . uniqid() . "', 'Morning Desert Safari', 'Morning Safari', 150.00, 180.00, 130.00, 'per_person', 50.00, '$comp_id'),
            ('pkg_evening_" . uniqid() . "', 'Evening Desert Safari (Standard)', 'Evening Safari', 250.00, 290.00, 220.00, 'per_person', 80.00, '$comp_id'),
            ('pkg_vip_" . uniqid() . "', 'VIP Evening Desert Safari', 'Evening Safari', 400.00, 450.00, 380.00, 'per_person', 120.00, '$comp_id')");
        
        // Seed default settings
        $conn->query("INSERT INTO settings (setting_key, setting_value, company_id) VALUES ('show_coupons', '1', '$comp_id')");
        
        echo json_encode([
            "status" => "success",
            "company_id" => $comp_id,
            "company" => [
                "id" => $comp_id,
                "name" => $name,
                "slug" => $slug_esc,
                "email" => $email,
                "whatsapp" => $whatsapp,
                "address" => $address,
                "contactPerson" => $contactPerson,
                "bankAccountName" => $bankAccountName,
                "bankName" => $bankName,
                "bankAccountNumber" => $bankAccountNumber,
                "bankIban" => $bankIban,
                "logo" => $logo,
                "status" => "active"
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to save company details: " . $conn->error]);
    }
    exit();
}

// 1.6 LOAD COMPANIES (MASTER ADMIN ONLY)
if ($action === 'load_companies') {
    $res = $conn->query("SELECT * FROM companies ORDER BY createdAt DESC");
    $companiesList = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            // Count bookings for statistics
            $b_res = $conn->query("SELECT COUNT(*) as b_count FROM bookings WHERE company_id = '" . $row['id'] . "'");
            $b_count = 0;
            if ($b_res) {
                $b_row = $b_res->fetch_assoc();
                $b_count = (int)$b_row['b_count'];
            }
            $row['booking_count'] = $b_count;
            $companiesList[] = $row;
        }
    }
    echo json_encode(["status" => "success", "data" => $companiesList]);
    exit();
}

// 1.7 TOGGLE COMPANY STATUS (MASTER ADMIN ONLY)
if ($action === 'toggle_company_status') {
    $input = json_decode(file_get_contents('php://input'), true);
    $comp_id = isset($input['company_id']) ? $conn->real_escape_string($input['company_id']) : '';
    $status = isset($input['status']) ? $conn->real_escape_string($input['status']) : '';
    
    if ($comp_id && in_array($status, ['active', 'suspended'])) {
        $conn->query("UPDATE companies SET status = '$status' WHERE id = '$comp_id'");
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid company ID or status"]);
    }
    exit();
}

// 1.8 UPDATE COMPANY DOMAIN / PASSWORD (MASTER ADMIN / COMPANY OWNER)
if ($action === 'update_company_profile') {
    $input = json_decode(file_get_contents('php://input'), true);
    $comp_id = isset($input['company_id']) ? $conn->real_escape_string($input['company_id']) : '';
    
    if (!$comp_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing company ID"]);
        exit();
    }
    
    $updates = [];
    if (isset($input['domain'])) {
        $domain = $conn->real_escape_string($input['domain']);
        $updates[] = "domain = '$domain'";
    }
    if (isset($input['password']) && trim($input['password']) !== '') {
        $password = $conn->real_escape_string($input['password']);
        $updates[] = "password = '$password'";
    }
    if (isset($input['logo'])) {
        $logo = $conn->real_escape_string($input['logo']);
        $updates[] = "logo = '$logo'";
    }
    if (isset($input['bankAccountName'])) {
        $bankAccountName = $conn->real_escape_string($input['bankAccountName']);
        $updates[] = "bankAccountName = '$bankAccountName'";
    }
    if (isset($input['bankName'])) {
        $bankName = $conn->real_escape_string($input['bankName']);
        $updates[] = "bankName = '$bankName'";
    }
    if (isset($input['bankAccountNumber'])) {
        $bankAccountNumber = $conn->real_escape_string($input['bankAccountNumber']);
        $updates[] = "bankAccountNumber = '$bankAccountNumber'";
    }
    if (isset($input['bankIban'])) {
        $bankIban = $conn->real_escape_string($input['bankIban']);
        $updates[] = "bankIban = '$bankIban'";
    }
    
    if (isset($input['features'])) {
        $features = $conn->real_escape_string($input['features']);
        $updates[] = "features = '$features'";
    }
    
    if (count($updates) > 0) {
        $conn->query("UPDATE companies SET " . implode(', ', $updates) . " WHERE id = '$comp_id'");
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "No updates specified"]);
    }
    exit();
}

// 2. LOAD TENANT DATA ACTION
if ($action === 'load') {
    $company_id = isset($_GET['company_id']) ? $conn->real_escape_string($_GET['company_id']) : '';
    if (!$company_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing company_id parameter."]);
        exit();
    }
    
    $data = [];
    foreach (array_keys($tables) as $table) {
        if ($table === 'companies') continue;
        
        $rows = [];
        if ($table === 'company_details') {
            // Load company info mapped to company_details columns
            $result = $conn->query("SELECT id, name as fullName, address, contactPerson, whatsapp, email, 
                                           DATE_FORMAT(createdAt, '%Y-%m-%d') as regDate, 
                                           'Licensed Desert Safari CRM Operator' as licenseNo,
                                           'Morning Safari, Evening Safari, Chauffeur Services' as whatWeOffer 
                                    FROM companies WHERE id = '$company_id'");
        } else {
            $result = $conn->query("SELECT * FROM $table WHERE company_id = '$company_id'");
        }
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                if ($table === 'bookings') {
                    $row['pax'] = (int)$row['pax'];
                    $row['price'] = (float)$row['price'];
                    $row['addonPrice'] = isset($row['addonPrice']) ? (float)$row['addonPrice'] : 0.00;
                } else if ($table === 'drivers') {
                    $row['defaultSalary'] = (float)$row['defaultSalary'];
                    $row['defaultFuel'] = (float)$row['defaultFuel'];
                } else if ($table === 'expenses') {
                    $row['salary'] = isset($row['salary']) ? (float)$row['salary'] : 0.00;
                    $row['carPetrol'] = isset($row['carPetrol']) ? (float)$row['carPetrol'] : 0.00;
                    $row['campUse'] = isset($row['campUse']) ? (float)$row['campUse'] : 0.00;
                    $row['misc'] = isset($row['misc']) ? (float)$row['misc'] : 0.00;
                } else if ($table === 'partners') {
                    $row['commissionRate'] = (float)$row['commissionRate'];
                    $row['packages'] = json_decode($row['packages'], true) ?: new stdClass();
                } else if ($table === 'cars') {
                    $row['installment'] = (float)$row['installment'];
                    $row['currentValue'] = (float)$row['currentValue'];
                    $row['instDate'] = (int)$row['instDate'];
                    $row['passengers'] = (int)$row['passengers'];
                    $row['ledger'] = json_decode($row['ledger'] ?? '[]', true) ?: [];
                } else if ($table === 'packages') {
                    $row['rate'] = (float)$row['rate'];
                    $row['peakRate'] = (float)$row['peakRate'];
                    $row['offpeakRate'] = (float)$row['offpeakRate'];
                    $row['campUse'] = (float)$row['campUse'];
                    $row['quadbikeExpense'] = (float)$row['quadbikeExpense'];
                    $row['addons'] = json_decode($row['addons'] ?? '[]', true) ?: [];
                } else if ($table === 'coupons') {
                    $row['customPrice'] = (float)$row['customPrice'];
                    $row['isActive'] = (int)$row['isActive'];
                }
                $rows[] = $row;
            }
        }
        $data[$table] = $rows;
    }
    echo json_encode(["status" => "success", "data" => $data]);
    exit();
}

// 2.5 SAVE SETTING ACTION
if ($action === 'save_setting') {
    $input = json_decode(file_get_contents('php://input'), true);
    $company_id = isset($_GET['company_id']) ? $conn->real_escape_string($_GET['company_id']) : '';
    $key = isset($input['key']) ? $conn->real_escape_string($input['key']) : '';
    $val = isset($input['value']) ? $conn->real_escape_string($input['value']) : '';
    
    if ($key && $company_id) {
        $conn->query("INSERT INTO settings (setting_key, setting_value, company_id) VALUES ('$key', '$val', '$company_id') 
                      ON DUPLICATE KEY UPDATE setting_value = '$val'");
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Missing key or company ID"]);
    }
    exit();
}

// 3. SAVE ITEM ACTION
if ($action === 'save') {
    $table = isset($_GET['table']) ? $_GET['table'] : '';
    $company_id = isset($_GET['company_id']) ? $conn->real_escape_string($_GET['company_id']) : '';
    
    if (!array_key_exists($table, $tables) && $table !== 'company_details') {
        echo json_encode(["status" => "error", "message" => "Invalid table"]);
        exit();
    }
    
    if (!$company_id) {
        echo json_encode(["status" => "error", "message" => "Missing company ID for save action."]);
        exit();
    }
    
    $item = json_decode(file_get_contents('php://input'), true);
    if (!$item || !isset($item['id'])) {
        echo json_encode(["status" => "error", "message" => "Invalid data or missing ID"]);
        exit();
    }
    
    // Check if updating company details
    if ($table === 'company_details') {
        $name = $conn->real_escape_string($item['fullName'] ?? '');
        $address = $conn->real_escape_string($item['address'] ?? '');
        $contactPerson = $conn->real_escape_string($item['contactPerson'] ?? '');
        $whatsapp = $conn->real_escape_string($item['whatsapp'] ?? '');
        $email = $conn->real_escape_string($item['email'] ?? '');
        
        $sql = "UPDATE companies SET name = '$name', address = '$address', contactPerson = '$contactPerson', whatsapp = '$whatsapp', email = '$email' 
                WHERE id = '$company_id'";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        exit();
    }
    
    // Get valid columns for safety filtering
    $columns_res = $conn->query("SHOW COLUMNS FROM $table");
    $valid_columns = [];
    if ($columns_res) {
        while ($col = $columns_res->fetch_assoc()) {
            $valid_columns[] = $col['Field'];
        }
    }
    
    // Always inject company_id
    $item['company_id'] = $company_id;
    
    $keys = [];
    $values = [];
    $updates = [];
    
    foreach ($item as $key => $val) {
        if (!in_array($key, $valid_columns)) {
            continue; // Safely ignore keys not matching a database column
        }
        if ($val === null) {
            $val = '';
        } else if (is_array($val) || is_object($val)) {
            $val = json_encode($val);
        } else if (is_bool($val)) {
            $val = $val ? '1' : '0';
        }
        $escaped = $conn->real_escape_string((string)$val);
        $keys[] = $key;
        $values[] = "'$escaped'";
        $updates[] = "$key = '$escaped'";
    }
    
    $isNewBooking = false;
    if ($table === 'bookings') {
        $checkId = $conn->real_escape_string($item['id'] ?? '');
        $existingCheck = $conn->query("SELECT id FROM bookings WHERE id = '$checkId' AND company_id = '$company_id'");
        $isNewBooking = ($existingCheck && $existingCheck->num_rows == 0);
    }

    $sql = "INSERT INTO $table (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $values) . ")
            ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
            
    if ($conn->query($sql)) {
        // POST to FastAPI WhatsApp Agent if booking was saved AND it's a new booking not created by the WhatsApp agent itself
        if ($table === 'bookings') {
            $partnerId = $item['partnerId'] ?? '';

            if ($isNewBooking && $partnerId !== 'whatsapp') {
                $ch = curl_init("http://localhost:8000/api/bookings/notify-new");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($item));
                curl_setopt($ch, CURLOPT_TIMEOUT, 2); // non-blocking quick timeout
                curl_exec($ch);
                curl_close($ch);
            }
        }
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

// 4. DELETE ITEM ACTION
if ($action === 'delete') {
    $table = isset($_GET['table']) ? $_GET['table'] : '';
    $company_id = isset($_GET['company_id']) ? $conn->real_escape_string($_GET['company_id']) : '';
    
    if (!array_key_exists($table, $tables)) {
        echo json_encode(["status" => "error", "message" => "Invalid table"]);
        exit();
    }
    
    if (!$company_id) {
        echo json_encode(["status" => "error", "message" => "Missing company ID for delete action."]);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? $conn->real_escape_string((string)$input['id']) : '';
    
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Missing ID"]);
        exit();
    }
    
    $sql = "DELETE FROM $table WHERE id = '$id' AND company_id = '$company_id'";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

// 5. RESEED DATABASE ACTION (UPSERT ONLY, NO DELETIONS)
if ($action === 'reseed') {
    $input = json_decode(file_get_contents('php://input'), true);
    $company_id = isset($_GET['company_id']) ? $conn->real_escape_string($_GET['company_id']) : '';
    
    if (!is_array($input)) {
        echo json_encode(["status" => "error", "message" => "Invalid seeding payload"]);
        exit();
    }
    
    if (!$company_id) {
        echo json_encode(["status" => "error", "message" => "Missing company ID for reseed action."]);
        exit();
    }
    
    foreach ($input as $table => $dataList) {
        if (!array_key_exists($table, $tables)) continue;
        
        // Get valid columns for safety filtering
        $columns_res = $conn->query("SHOW COLUMNS FROM $table");
        $valid_columns = [];
        if ($columns_res) {
            while ($col = $columns_res->fetch_assoc()) {
                $valid_columns[] = $col['Field'];
            }
        }

        foreach ($dataList as $item) {
            $item['company_id'] = $company_id;
            
            $keys = [];
            $values = [];
            $updates = [];
            foreach ($item as $key => $val) {
                if (!in_array($key, $valid_columns)) continue;
                if ($val === null) {
                    $val = '';
                } else if (is_array($val) || is_object($val)) {
                    $val = json_encode($val);
                } else if (is_bool($val)) {
                    $val = $val ? '1' : '0';
                }
                $escaped = $conn->real_escape_string((string)$val);
                $keys[] = $key;
                $values[] = "'$escaped'";
                $updates[] = "$key = '$escaped'";
            }
            if (count($keys) > 0) {
                $sql = "INSERT INTO $table (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $values) . ")
                        ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
                $conn->query($sql);
            }
        }
    }
    echo json_encode(["status" => "success"]);
    exit();
}

echo json_encode(["status" => "error", "message" => "Unknown action"]);
