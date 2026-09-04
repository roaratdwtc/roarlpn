<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// MySQL Connection Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'roarvbqp_rbiu');
define('DB_PASS', 'Pakistan@123123');
define('DB_NAME', 'roarvbqp_rbidb');
// Connect to MySQL
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed. Please edit api.php with valid Namecheap MySQL credentials."]);
    exit();
}

// Create database if not exists
$conn->query("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
$conn->select_db(DB_NAME);

// Setup / Initialize tables if they do not exist
$tables = [
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
        carPax VARCHAR(255) DEFAULT '',
        tourType VARCHAR(50) DEFAULT 'pick_drop',
        pickedUpBy VARCHAR(255) DEFAULT '',
        pickedUpAt VARCHAR(100) DEFAULT ''
    )",
    "drivers" => "CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        whatsapp VARCHAR(100),
        carPlate VARCHAR(100),
        regDate VARCHAR(50),
        defaultSalary DECIMAL(10,2) DEFAULT 100,
        defaultFuel DECIMAL(10,2) DEFAULT 150
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
        notes TEXT
    )",
    "partners" => "CREATE TABLE IF NOT EXISTS partners (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        commissionRate DECIMAL(5,2),
        address VARCHAR(255),
        contactPerson VARCHAR(255),
        whatsapp VARCHAR(100),
        email VARCHAR(255),
        packages TEXT
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
        ledger TEXT
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
        addons TEXT
    )",
    "coupons" => "CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(100),
        packageId VARCHAR(100),
        customPrice DECIMAL(10,2) DEFAULT 0.00,
        isActive INT DEFAULT 1,
        startDate VARCHAR(50) DEFAULT NULL,
        endDate VARCHAR(50) DEFAULT NULL
    )",
    "customers" => "CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        whatsapp VARCHAR(100),
        email VARCHAR(255)
    )",
    "settings" => "CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value LONGTEXT
    )",
    "company_details" => "CREATE TABLE IF NOT EXISTS company_details (
        id VARCHAR(100) PRIMARY KEY,
        fullName VARCHAR(255) DEFAULT '',
        address VARCHAR(255) DEFAULT '',
        contactPerson VARCHAR(255) DEFAULT '',
        whatsapp VARCHAR(100) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        regDate VARCHAR(50) DEFAULT '',
        licenseNo VARCHAR(100) DEFAULT '',
        whatWeOffer TEXT DEFAULT NULL
    )",
    "company_documents" => "CREATE TABLE IF NOT EXISTS company_documents (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        expiryDate VARCHAR(50) DEFAULT '',
        fileName VARCHAR(255) DEFAULT '',
        fileType VARCHAR(100) DEFAULT '',
        fileData LONGTEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL
    )",
    "car_expenses" => "CREATE TABLE IF NOT EXISTS car_expenses (
        id VARCHAR(100) PRIMARY KEY,
        carId VARCHAR(100) DEFAULT '',
        plateNo VARCHAR(100) DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        amount DECIMAL(10,2) DEFAULT 0.00,
        date VARCHAR(50) DEFAULT '',
        driverName VARCHAR(255) DEFAULT '',
        workshopName VARCHAR(255) DEFAULT '',
        invoiceNo VARCHAR(100) DEFAULT '',
        odometer INT DEFAULT 0,
        paymentMethod VARCHAR(100) DEFAULT 'Cash',
        status VARCHAR(50) DEFAULT 'paid',
        notes TEXT DEFAULT NULL
    )",
    "company_expenses" => "CREATE TABLE IF NOT EXISTS company_expenses (
        id VARCHAR(100) PRIMARY KEY,
        category VARCHAR(100) DEFAULT '',
        title VARCHAR(255) DEFAULT '',
        amount DECIMAL(10,2) DEFAULT 0.00,
        date VARCHAR(50) DEFAULT '',
        dueDate VARCHAR(50) DEFAULT '',
        paymentMethod VARCHAR(100) DEFAULT 'Bank Transfer',
        vendor VARCHAR(255) DEFAULT '',
        invoiceNo VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'paid',
        notes TEXT DEFAULT NULL
    )",
    "company_sims" => "CREATE TABLE IF NOT EXISTS company_sims (
        id VARCHAR(100) PRIMARY KEY,
        phoneNumber VARCHAR(100) DEFAULT '',
        provider VARCHAR(100) DEFAULT 'Du',
        planName VARCHAR(100) DEFAULT '',
        monthlyCost DECIMAL(10,2) DEFAULT 0.00,
        assignedAgent VARCHAR(255) DEFAULT '',
        agentRole VARCHAR(100) DEFAULT 'Inbound Sales & VIP Bookings',
        simCardNumber VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'active',
        assignedDate VARCHAR(50) DEFAULT '',
        notes TEXT DEFAULT NULL
    )",
    "car_documents" => "CREATE TABLE IF NOT EXISTS car_documents (
        id VARCHAR(100) PRIMARY KEY,
        carPlate VARCHAR(100) DEFAULT '',
        title VARCHAR(255) DEFAULT '',
        category VARCHAR(100) DEFAULT 'Mulkiya',
        issueDate VARCHAR(50) DEFAULT '',
        expiryDate VARCHAR(50) DEFAULT '',
        fileName VARCHAR(255) DEFAULT '',
        fileType VARCHAR(100) DEFAULT '',
        fileSize VARCHAR(50) DEFAULT '',
        fileData LONGTEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        uploadedAt VARCHAR(50) DEFAULT ''
    )"
];

foreach ($tables as $name => $query) {
    if (!$conn->query($query)) {
        echo json_encode(["status" => "error", "message" => "Failed to create table $name: " . $conn->error]);
        exit();
    }
}

$conn->query("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('show_coupons', '1')");
$conn->query("ALTER TABLE settings MODIFY COLUMN setting_value LONGTEXT");
$chkPickup = $conn->query("SHOW COLUMNS FROM bookings LIKE 'pickedUpBy'");
if ($chkPickup && $chkPickup->num_rows === 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN pickedUpBy VARCHAR(255) DEFAULT '', ADD COLUMN pickedUpAt VARCHAR(100) DEFAULT ''");
}

$conn->query("INSERT IGNORE INTO company_details (id, fullName, address, contactPerson, whatsapp, email, regDate, licenseNo, whatWeOffer) VALUES (
    'company_info',
    'Roar Adventure Tourism LLC',
    'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
    'Mr. Abid Ali',
    '+97145578679',
    'info@roaradventuretourism.com',
    '2016-01-01',
    'DET/DTCM Licensed Tour Operator',
    'Morning Desert Safari, Evening Desert Safari, VIP Desert Safari, Private Desert Safari, City Tours, Chauffeur Services, Private Transfers, Marina Cruise Dinner Services'
)");

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

$colCheckCarPax = $conn->query("SHOW COLUMNS FROM bookings LIKE 'carPax'");
if ($colCheckCarPax && $colCheckCarPax->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN carPax VARCHAR(255) DEFAULT ''");
}

$colCheckTourType = $conn->query("SHOW COLUMNS FROM bookings LIKE 'tourType'");
if ($colCheckTourType && $colCheckTourType->num_rows == 0) {
    $conn->query("ALTER TABLE bookings ADD COLUMN tourType VARCHAR(50) DEFAULT 'pick_drop'");
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
    
    if (strtolower($email) === 'info@roaradventuretourism.com' && $password === 'R4roar!786*') {
        echo json_encode(["status" => "success", "user" => ["email" => $email]]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or security password."]);
    }
    exit();
}

// 2. LOAD ALL DATA ACTION
if ($action === 'load') {
    $data = [];
    foreach (array_keys($tables) as $table) {
        $result = $conn->query("SELECT * FROM $table");
        $rows = [];
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
                } else if ($table === 'car_expenses') {
                    $row['amount'] = (float)$row['amount'];
                    $row['odometer'] = (int)($row['odometer'] ?? 0);
                } else if ($table === 'company_expenses') {
                    $row['amount'] = (float)$row['amount'];
                } else if ($table === 'company_sims') {
                    $row['monthlyCost'] = (float)$row['monthlyCost'];
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
    $key = isset($input['key']) ? $conn->real_escape_string($input['key']) : '';
    $val = isset($input['value']) ? $conn->real_escape_string($input['value']) : '';
    if ($key) {
        $conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('$key', '$val') ON DUPLICATE KEY UPDATE setting_value = '$val'");
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Missing key"]);
    }
    exit();
}

// 2.7 CREATE STRIPE CHECKOUT SESSION ACTION
if ($action === 'create-stripe-session') {
    $bookingId = isset($_GET['bookingId']) ? $conn->real_escape_string($_GET['bookingId']) : '';
    $successUrl = isset($_GET['successUrl']) ? $_GET['successUrl'] : '';
    $cancelUrl = isset($_GET['cancelUrl']) ? $_GET['cancelUrl'] : '';
    
    if (!$bookingId) {
        echo json_encode(["status" => "error", "message" => "Missing bookingId"]);
        exit();
    }
    
    // Fetch booking details
    $bookingRes = $conn->query("SELECT * FROM bookings WHERE id = '$bookingId'");
    if (!$bookingRes || $bookingRes->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Booking not found"]);
        exit();
    }
    $booking = $bookingRes->fetch_assoc();
    
    // Fetch Stripe secret key
    $stripeSecretRes = $conn->query("SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key'");
    $stripeSecretKey = '';
    if ($stripeSecretRes && $stripeSecretRes->num_rows > 0) {
        $row = $stripeSecretRes->fetch_assoc();
        $stripeSecretKey = trim($row['setting_value']);
    }
    
    if (empty($stripeSecretKey)) {
        // Return simulation flag if Stripe key is not configured
        echo json_encode(["status" => "simulate", "message" => "Stripe secret key not set. Using simulator mode."]);
        exit();
    }
    
    // Call Stripe API
    $packageName = $booking['packageName'] ?: 'Desert Safari Booking';
    $price = floatval($booking['price']);
    $amountInCents = intval($price * 100);
    
    $ch = curl_init("https://api.stripe.com/v1/checkout/sessions");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
    
    $fields = [
        'payment_method_types[0]' => 'card',
        'line_items[0][price_data][currency]' => 'aed',
        'line_items[0][price_data][product_data][name]' => $packageName,
        'line_items[0][price_data][unit_amount]' => $amountInCents,
        'line_items[0][quantity]' => 1,
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'client_reference_id' => $bookingId
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $resData = json_decode($response, true);
        if (isset($resData['url'])) {
            echo json_encode(["status" => "success", "url" => $resData['url']]);
            exit();
        }
    }
    
    // Fallback to simulation if Stripe API fails (e.g. invalid key)
    echo json_encode(["status" => "simulate", "message" => "Stripe API error: " . ($response ?: 'Connection failed')]);
    exit();
}

// 2.8 CHARGE STRIPE DIRECTLY ACTION
if ($action === 'charge-stripe') {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = isset($input['token']) ? $conn->real_escape_string($input['token']) : '';
    $amount = isset($input['amount']) ? floatval($input['amount']) : 0.0;
    $bookingId = isset($input['bookingId']) ? $conn->real_escape_string($input['bookingId']) : '';
    $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
    
    if (!$token || !$amount || !$bookingId) {
        echo json_encode(["status" => "error", "message" => "Missing required charge fields"]);
        exit();
    }
    
    // Fetch Stripe secret key
    $stripeSecretRes = $conn->query("SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key'");
    $stripeSecretKey = '';
    if ($stripeSecretRes && $stripeSecretRes->num_rows > 0) {
        $row = $stripeSecretRes->fetch_assoc();
        $stripeSecretKey = trim($row['setting_value']);
    }
    
    if (empty($stripeSecretKey)) {
        echo json_encode(["status" => "error", "message" => "Stripe secret key not configured."]);
        exit();
    }
    
    $amountInCents = intval($amount * 100);
    
    $ch = curl_init("https://api.stripe.com/v1/charges");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
    
    $fields = [
        'amount' => $amountInCents,
        'currency' => 'aed',
        'source' => $token,
        'description' => "Desert Safari Booking #" . $bookingId,
        'receipt_email' => $email
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $res = json_decode($response, true);
        if ($res && isset($res['paid']) && $res['paid'] == true) {
            $conn->query("UPDATE bookings SET status = 'confirmed' WHERE id = '$bookingId'");
            echo json_encode(["status" => "success", "chargeId" => $res['id']]);
            exit();
        }
    }
    
    echo json_encode(["status" => "error", "message" => "Stripe transaction rejected: " . ($response ?: 'Network timeout')]);
    exit();
}

// 3. SAVE ITEM ACTION
if ($action === 'save') {
    $table = isset($_GET['table']) ? $_GET['table'] : '';
    if (!array_key_exists($table, $tables)) {
        echo json_encode(["status" => "error", "message" => "Invalid table"]);
        exit();
    }
    
    $item = json_decode(file_get_contents('php://input'), true);
    if (!$item || !isset($item['id'])) {
        echo json_encode(["status" => "error", "message" => "Invalid data or missing ID"]);
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
        $existingCheck = $conn->query("SELECT id FROM bookings WHERE id = '$checkId'");
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
    if (!array_key_exists($table, $tables)) {
        echo json_encode(["status" => "error", "message" => "Invalid table"]);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? $conn->real_escape_string((string)$input['id']) : '';
    
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Missing ID"]);
        exit();
    }
    
    $sql = "DELETE FROM $table WHERE id = '$id'";
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
    if (!is_array($input)) {
        echo json_encode(["status" => "error", "message" => "Invalid seeding payload"]);
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

// 6. CLEAN OLD BOOKINGS (PRE-AUGUST 2026)
if ($action === 'clean_old_bookings') {
    $delBookings = $conn->query("DELETE FROM bookings WHERE date < '2026-08-01'");
    $delExpenses = $conn->query("DELETE FROM expenses WHERE date < '2026-08-01'");
    $delCustomers = $conn->query("DELETE FROM customers WHERE whatsapp NOT IN (SELECT DISTINCT whatsapp FROM bookings)");
    echo json_encode([
        "status" => "success", 
        "message" => "Successfully deleted pre-August 2026 bookings, expenses, and orphan customers from MySQL."
    ]);
    exit();
}

echo json_encode(["status" => "error", "message" => "Unknown action"]);
