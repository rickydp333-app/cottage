<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$sources = [
  [
    'source' => 'Airbnb',
    'url' => 'https://www.airbnb.ca/calendar/ical/1156633077219967823.ics?t=9379c359f5fc43e0a317364993ec7cfd'
  ],
  [
    'source' => 'VRBO',
    'url' => 'https://www.vrbo.com/icalendar/1b1d72b1c0054ec888c039ac27ca0baf.ics?nonTentative'
  ]
];

$result = [
  'fetchedAt' => gmdate('c'),
  'sources' => []
];

foreach ($sources as $source) {
  $ics = fetchIcs($source['url']);
  if ($ics === false) {
    $result['sources'][] = [
      'source' => $source['source'],
      'ok' => false,
      'events' => []
    ];
    continue;
  }

  $result['sources'][] = [
    'source' => $source['source'],
    'ok' => true,
    'events' => parseIcsEvents($ics)
  ];
}

echo json_encode($result);

function fetchIcs($url) {
  $context = stream_context_create([
    'http' => [
      'method' => 'GET',
      'header' => "User-Agent: RentersCottage/1.0\r\n",
      'timeout' => 20
    ]
  ]);

  $response = @file_get_contents($url, false, $context);
  return $response === false ? false : $response;
}

function parseIcsEvents($icsText) {
  $unfolded = preg_replace("/\r?\n[ \t]/", '', (string)$icsText);
  $lines = preg_split('/\r?\n/', $unfolded);
  $events = [];
  $current = null;

  foreach ($lines as $line) {
    if ($line === 'BEGIN:VEVENT') {
      $current = [];
      continue;
    }

    if ($line === 'END:VEVENT') {
      if (isset($current['dtstart'])) {
        $start = parseIcsDate($current['dtstart']);
        $end = isset($current['dtend']) ? parseIcsDate($current['dtend']) : null;
        if ($start !== null) {
          if ($end === null) {
            $end = gmdate('c', strtotime($start . ' +1 day'));
          }
          $events[] = [
            'start' => $start,
            'end' => $end,
            'summary' => $current['summary'] ?? 'Reserved'
          ];
        }
      }
      $current = null;
      continue;
    }

    if ($current === null) {
      continue;
    }

    $separator = strpos($line, ':');
    if ($separator === false) {
      continue;
    }

    $rawKey = substr($line, 0, $separator);
    $value = substr($line, $separator + 1);
    $key = strtolower(explode(';', $rawKey)[0]);

    if (in_array($key, ['dtstart', 'dtend', 'summary'], true)) {
      $current[$key] = str_replace(['\\n', '\\,'], [' ', ','], $value);
    }
  }

  return $events;
}

function parseIcsDate($value) {
  $value = trim((string)$value);

  if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $value, $m)) {
    return gmdate('c', strtotime("{$m[1]}-{$m[2]}-{$m[3]}T00:00:00Z"));
  }

  if (preg_match('/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/', $value, $m)) {
    return gmdate('c', gmmktime((int)$m[4], (int)$m[5], (int)$m[6], (int)$m[2], (int)$m[3], (int)$m[1]));
  }

  if (preg_match('/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/', $value, $m)) {
    return gmdate('c', strtotime("{$m[1]}-{$m[2]}-{$m[3]}T{$m[4]}:{$m[5]}:{$m[6]}Z"));
  }

  return null;
}