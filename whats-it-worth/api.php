<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
  $keyFiles = array_filter([
    getenv('HOME') ? rtrim(getenv('HOME'), '/') . '/.openai_key' : null,
    '/home/dh_v7sia3/.openai_key',
    dirname(__DIR__, 2) . '/.openai_key'
  ]);
  foreach ($keyFiles as $keyFile) {
    if (is_readable($keyFile)) {
      $apiKey = trim((string) file_get_contents($keyFile));
      if ($apiKey !== '') {
        break;
      }
    }
  }
}
$input = json_decode(file_get_contents('php://input'), true);
$image = $input['image'] ?? '';
$category = $input['category'] ?? 'Auto-detect';
$condition = $input['condition'] ?? 'Good';

if (!$apiKey || !preg_match('/^data:image\/(jpeg|png|webp|gif);base64,/', $image)) {
  http_response_code(503);
  echo json_encode(['error' => 'Live appraisal is not configured yet.']);
  exit;
}

$payload = [
  'model' => 'gpt-4o-mini',
  'temperature' => 0.2,
  'messages' => [[
    'role' => 'user',
    'content' => [
      ['type' => 'text', 'text' => "Identify this resale item and estimate Canadian prices. Category hint: {$category}. Condition: {$condition}. Return only JSON with keys title, category, confidence, condition, newPrice, usedLow, usedHigh, quickSale, suggested, note. Prices must be numbers in CAD. Be conservative and explain uncertainty in note."],
      ['type' => 'image_url', 'image_url' => ['url' => $image]]
    ]
  ]]
];

$curl = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($curl, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Content-Type: application/json'],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_TIMEOUT => 45
]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($status < 200 || $status >= 300 || !$response) {
  http_response_code(502);
  echo json_encode(['error' => 'The appraisal provider did not respond.']);
  exit;
}

$data = json_decode($response, true);
$content = $data['choices'][0]['message']['content'] ?? '';
$content = preg_replace('/^```json\s*|\s*```$/', '', trim($content));
$result = json_decode($content, true);

if (!is_array($result)) {
  http_response_code(502);
  echo json_encode(['error' => 'The appraisal response was not valid JSON.']);
  exit;
}

$result['confidence'] = max(0, min(100, (float) ($result['confidence'] ?? 0) * ((float) ($result['confidence'] ?? 0) <= 1 ? 100 : 1)));
$result['newPrice'] = max(0, (float) ($result['newPrice'] ?? 0));
$result['usedLow'] = max(0, (float) ($result['usedLow'] ?? 0));
$result['usedHigh'] = max($result['usedLow'], (float) ($result['usedHigh'] ?? 0));
$result['quickSale'] = max(0, min($result['usedLow'], (float) ($result['quickSale'] ?? 0)));
$result['suggested'] = max($result['quickSale'], min($result['usedHigh'], (float) ($result['suggested'] ?? 0)));
$result['newPrice'] = round($result['newPrice']);
$result['usedLow'] = round($result['usedLow']);
$result['usedHigh'] = round($result['usedHigh']);
$result['quickSale'] = round($result['quickSale']);
$result['suggested'] = round($result['suggested']);

echo json_encode($result);
