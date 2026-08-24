<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$configPath = getenv('COTTAGE_SPOTIFY_CONFIG') ?: ($_SERVER['HOME'] ?? '') . '/.spotify_cottage_config.php';
$config = is_file($configPath) ? require $configPath : [];

if (!is_array($config) || empty($config['client_id']) || empty($config['client_secret']) || empty($config['refresh_token'])) {
  respond(['error' => 'Spotify control is not configured.'], 503);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'POST' ? 'transfer' : 'devices');
$body = json_decode(file_get_contents('php://input'), true);
$body = is_array($body) ? $body : [];

$token = getAccessToken($config);
if ($token === false) {
  respond(['error' => 'Spotify authorization is unavailable.'], 503);
}

if ($action === 'devices' && $method === 'GET') {
  $result = spotifyRequest('GET', '/v1/me/player/devices', $token);
  if ($result['status'] >= 400) {
    respond(['error' => 'Unable to read available speakers.'], 502);
  }

  $devices = [];
  foreach (($result['body']['devices'] ?? []) as $device) {
    if (!empty($device['name']) && !empty($device['id'])) {
      $devices[] = [
        'name' => $device['name'],
        'active' => !empty($device['is_active'])
      ];
    }
  }
  respond(['devices' => $devices]);
}

if ($method !== 'POST' || !in_array($action, ['transfer', 'play', 'pause', 'next'], true)) {
  respond(['error' => 'Unsupported Spotify operation.'], 405);
}

$deviceName = trim((string)($body['deviceName'] ?? ''));
if ($deviceName === '') {
  respond(['error' => 'A speaker name is required.'], 400);
}

$devicesResult = spotifyRequest('GET', '/v1/me/player/devices', $token);
$deviceId = null;
foreach (($devicesResult['body']['devices'] ?? []) as $device) {
  if (($device['name'] ?? '') === $deviceName) {
    $deviceId = $device['id'] ?? null;
    break;
  }
}

if (!$deviceId) {
  respond(['error' => 'That speaker is not currently available.'], 404);
}

if ($action === 'transfer') {
  $result = spotifyRequest('PUT', '/v1/me/player', $token, ['device_ids' => [$deviceId], 'play' => false]);
} elseif ($action === 'play') {
  $result = spotifyRequest('PUT', '/v1/me/player/play?device_id=' . rawurlencode($deviceId), $token, [
    'context_uri' => $config['playlist_uri'] ?? ''
  ]);
} elseif ($action === 'pause') {
  $result = spotifyRequest('PUT', '/v1/me/player/pause?device_id=' . rawurlencode($deviceId), $token);
} else {
  $result = spotifyRequest('POST', '/v1/me/player/next?device_id=' . rawurlencode($deviceId), $token);
}

if ($result['status'] >= 400) {
  respond(['error' => 'Spotify could not update that speaker.'], 502);
}
respond(['ok' => true, 'device' => $deviceName]);

function getAccessToken($config) {
  $response = spotifyRequest('POST', 'https://accounts.spotify.com/api/token', null, [
    'grant_type' => 'refresh_token',
    'refresh_token' => $config['refresh_token']
  ], true, $config);
  return $response['status'] >= 400 ? false : ($response['body']['access_token'] ?? false);
}

function spotifyRequest($method, $path, $token, $payload = null, $form = false, $config = null) {
  $url = str_starts_with($path, 'http') ? $path : 'https://api.spotify.com' . $path;
  $headers = ['Accept: application/json'];
  if ($token) {
    $headers[] = 'Authorization: Bearer ' . $token;
  }
  if ($form) {
    $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    $payload = http_build_query($payload ?? []);
    $headers[] = 'Authorization: Basic ' . base64_encode($config['client_id'] . ':' . $config['client_secret']);
  } elseif ($payload !== null) {
    $headers[] = 'Content-Type: application/json';
    $payload = json_encode($payload);
  }

  $curl = curl_init($url);
  curl_setopt_array($curl, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_POSTFIELDS => $payload
  ]);
  $raw = curl_exec($curl);
  $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
  curl_close($curl);
  $decoded = json_decode($raw ?: '', true);
  return ['status' => $status ?: 500, 'body' => is_array($decoded) ? $decoded : []];
}

function respond($payload, $status = 200) {
  http_response_code($status);
  echo json_encode($payload);
  exit;
}
