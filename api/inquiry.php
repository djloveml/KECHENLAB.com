<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function text_length(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    return strlen($value);
}

function post_json(string $url, array $payload): bool
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        return false;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
        ]);
        curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_errno($ch);
        curl_close($ch);

        return $error === 0 && $status >= 200 && $status < 300;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $body,
            'timeout' => 5,
        ],
    ]);

    return file_get_contents($url, false, $context) !== false;
}

function notify_wechat(array $record): bool
{
    $webhook = trim((string)(getenv('WECHAT_WEBHOOK_URL') ?: ''));
    if ($webhook === '') {
        $webhookFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'wechat_webhook.txt';
        if (is_file($webhookFile)) {
            $webhook = trim((string)file_get_contents($webhookFile));
        }
    }

    if ($webhook === '') {
        return false;
    }

    if (!preg_match('#^https://qyapi\.weixin\.qq\.com/cgi-bin/webhook/send\?key=#', $webhook)) {
        return false;
    }

    $content = sprintf(
        "### 新客户询盘\n> 姓名：%s\n> 手机：%s\n> 邮箱：%s\n> 产品：%s\n> 需求：%s\n> 时间：%s\n> 来源：%s",
        $record['name'],
        $record['phone'],
        $record['email'] !== '' ? $record['email'] : '未填写',
        $record['product'],
        $record['message'] !== '' ? $record['message'] : '未填写',
        $record['created_at'],
        $record['source'] !== '' ? $record['source'] : '未知'
    );

    return post_json($webhook, [
        'msgtype' => 'markdown',
        'markdown' => [
            'content' => $content,
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$product = trim((string)($_POST['product'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '' || text_length($name) > 60) {
    respond(422, ['ok' => false, 'message' => 'Please enter your name.']);
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
$isChineseMobile = preg_match('/^1[3-9]\d{9}$/', $phone) === 1;
$isInternationalPhone = preg_match('/^[0-9+()\-\s]{6,20}$/', $phone) === 1 && strlen((string)$phoneDigits) >= 6;

if (!$isChineseMobile && !$isInternationalPhone) {
    respond(422, ['ok' => false, 'message' => 'Please enter a valid phone number.']);
}

if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, ['ok' => false, 'message' => 'Please enter a valid email address.']);
}

if (text_length($message) > 200) {
    respond(422, ['ok' => false, 'message' => 'Requirement details must be 200 characters or fewer.']);
}

$allowedProducts = [
    '人工气候箱',
    '恒温恒湿箱',
    '恒温光照箱 / 植物培养箱',
    '生化培养箱 / 电热培养箱',
    '干燥箱 / 真空干燥箱',
    '全温振荡培养箱',
    '需要协助选型',
    'Climate Chamber',
    'Temperature Humidity Chamber',
    'Light Incubator / Plant Growth Chamber',
    'Biochemical / Electric Incubator',
    'Drying Oven / Vacuum Drying Oven',
    'Shaking Incubator',
    'Need selection support',
];

if ($product === '' || !in_array($product, $allowedProducts, true)) {
    respond(422, ['ok' => false, 'message' => 'Please select a valid product.']);
}

$record = [
    'created_at' => gmdate('c'),
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'product' => $product,
    'message' => $message,
    'source' => $_SERVER['HTTP_REFERER'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
];

$dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'inquiries.jsonl';

if (!is_dir($dataDir) && !mkdir($dataDir, 0750, true)) {
    respond(500, ['ok' => false, 'message' => 'Unable to prepare inquiry storage.']);
}

$line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;

if (file_put_contents($dataFile, $line, FILE_APPEND | LOCK_EX) === false) {
    respond(500, ['ok' => false, 'message' => 'Unable to save inquiry.']);
}

$notified = notify_wechat($record);

respond(200, ['ok' => true, 'notified' => $notified]);
