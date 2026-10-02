<?php
// Ephemeral remote rooms live outside the public web root. No SoundBreak credentials are stored here.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function fail(string $message, int $code=400): void { http_response_code($code); echo json_encode(['error'=>$message]); exit; }
$method=$_SERVER['REQUEST_METHOD']??'';
if (!in_array($method,['POST','GET','HEAD'],true)) fail('Unsupported method.',405);
$origin=$_SERVER['HTTP_ORIGIN']??'';
if ($method==='POST' && $origin!=='' && parse_url($origin,PHP_URL_HOST)!==parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST)) fail('Origin rejected.',403);
$dir=sys_get_temp_dir().'/rpdsgrove-'.substr(hash('sha256',__DIR__),0,16);
if (!is_dir($dir) && !@mkdir($dir,0700,true) && !is_dir($dir)) fail('Room storage unavailable.',503);
$documentRoot=realpath($_SERVER['DOCUMENT_ROOT']??'');$privateRoot=getenv('RPDGROVE_PRIVATE_DIR');
if(!is_string($privateRoot)||$privateRoot==='')$privateRoot=$documentRoot?dirname($documentRoot).'/.rpdsgrove-private':sys_get_temp_dir().'/rpdsgrove-private';
$privateDir=rtrim($privateRoot,'/\\').DIRECTORY_SEPARATOR.substr(hash('sha256',__DIR__),0,16);$uploadDir=$privateDir.DIRECTORY_SEPARATOR.'uploads';
if ($method==='GET'||$method==='HEAD') {
 if (($_GET['action']??'')!=='media') fail('Use POST.',405);
 serveUploadedAudio($uploadDir,$_GET['id']??'',$method);
}
$contentType=$_SERVER['CONTENT_TYPE']??'';
if (stripos($contentType,'application/json')===0) {
 $raw=file_get_contents('php://input',false,null,0,32769);
 if (strlen($raw)>32768) fail('Request too large.',413);
 $b=json_decode($raw,true);
 if (!is_array($b)) fail('Invalid request.');
}elseif(stripos($contentType,'multipart/form-data')===0 && ($_POST['action']??'')==='upload'){
 $b=$_POST;
}else fail('Use JSON or multipart audio upload.',415);
$action=$b['action']??'';
function uploadedMediaUrl($value): bool {
 if(!is_string($value))return false;$parts=parse_url($value);if(!is_array($parts))return false;
 $requestHost=parse_url('http://'.($_SERVER['HTTP_HOST']??''));$host=strtolower((string)($parts['host']??''));
 if(!$requestHost||$host!==strtolower((string)($requestHost['host']??''))||isset($parts['user'])||isset($parts['pass'])||isset($parts['fragment']))return false;
 $scheme=$parts['scheme']??'';$local=in_array($host,['127.0.0.1','localhost','::1'],true);
 if($scheme!=='https'&&!($scheme==='http'&&$local))return false;
 if(($parts['port']??null)!==($requestHost['port']??null)||($parts['path']??'')!=='/rpdsgrove/api.php')return false;
 parse_str((string)($parts['query']??''),$query);
 return count($query)===2&&($query['action']??'')==='media'&&is_string($query['id']??null)&&preg_match('/^[a-f0-9]{48}$/D',$query['id'])===1;
}
function song($s): ?array {
 if (!is_array($s)) return null;
 $url=$s['remoteUrl']??$s['url']??'';
 $soundbreak=is_string($url)&&preg_match('~^https://audio\.soundbreak\.ai/[A-Za-z0-9/_-]+\.mp3$~D',$url)===1;
 if(!$soundbreak&&!uploadedMediaUrl($url))return null;
 $id=$s['id']??'';if(!is_string($id)||!preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$id))return null;
 $mime=$s['mime']??'audio/mpeg';if(!in_array($mime,['audio/mpeg','audio/wav','audio/mp4','audio/ogg','audio/flac','audio/aac'],true))$mime='audio/mpeg';
 return ['id'=>$id,'url'=>$url,'title'=>substr((string)($s['title']??'SoundBreak song'),0,160),'genre'=>substr((string)($s['genre']??'SoundBreak'),0,60),'version'=>substr((string)($s['version']??''),0,40),'art'=>preg_match('/^art-[0-3]\.svg$/D',(string)($s['art']??''))?$s['art']:'art-0.svg','mime'=>$mime];
}
function ids($a): array {if(!is_array($a))return [];return array_values(array_slice(array_filter($a,fn($v)=>is_string($v)&&preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$v)),0,200));}
function number($v,float $min,float $max): float {return is_numeric($v)?max($min,min($max,(float)$v)):$min;}
function audioMime(string $extension): ?string {return ['mp3'=>'audio/mpeg','wav'=>'audio/wav','m4a'=>'audio/mp4','ogg'=>'audio/ogg','flac'=>'audio/flac','aac'=>'audio/aac'][$extension]??null;}
function serveUploadedAudio(string $uploadDir,$value,string $method): void {
 if(!is_string($value)||!preg_match('/^[a-f0-9]{48}$/D',$value))fail('Invalid media link.',404);
 $metaPath=$uploadDir.'/'.$value.'.json';$meta=json_decode((string)@file_get_contents($metaPath),true);
 if(!is_array($meta)||!is_int($meta['expires']??null)||$meta['expires']<time()){@unlink($metaPath);@unlink($uploadDir.'/'.$value.'.bin');fail('Media link expired.',410);}
 $mime=$meta['mime']??'';$size=$meta['size']??0;$path=$uploadDir.'/'.$value.'.bin';
 if(!in_array($mime,['audio/mpeg','audio/wav','audio/mp4','audio/ogg','audio/flac','audio/aac'],true)||!is_int($size)||$size<1||!is_file($path)||filesize($path)!==$size)fail('Media unavailable.',404);
 $start=0;$end=$size-1;$range=$_SERVER['HTTP_RANGE']??'';
 if($range!==''){
  if(!preg_match('/^bytes=(\d*)-(\d*)$/D',$range,$parts)){$parts=[];}
  if(!$parts){http_response_code(416);header('Content-Range: bytes */'.$size);exit;}
  if($parts[1]===''){$suffix=(int)$parts[2];if($suffix<1){http_response_code(416);header('Content-Range: bytes */'.$size);exit;}$start=max(0,$size-$suffix);}
  else{$start=(int)$parts[1];$end=$parts[2]===''?$size-1:(int)$parts[2];}
  if($start>=$size||$end<$start){http_response_code(416);header('Content-Range: bytes */'.$size);exit;}
  $end=min($end,$size-1);http_response_code(206);header('Content-Range: bytes '.$start.'-'.$end.'/'.$size);
 }
 header('Content-Type: '.$mime);header('Content-Length: '.($end-$start+1));header('Accept-Ranges: bytes');header('Cache-Control: private, max-age=3600');header('X-Content-Type-Options: nosniff');header('Content-Disposition: inline; filename="audio.'.$meta['extension'].'"');
 if($method==='HEAD')exit;
 $stream=fopen($path,'rb');if(!$stream)fail('Media unavailable.',404);fseek($stream,$start);$remaining=$end-$start+1;
 while($remaining>0&&!feof($stream)){$chunk=fread($stream,min(65536,$remaining));if($chunk===false||$chunk==='')break;echo $chunk;$remaining-=strlen($chunk);}
 fclose($stream);exit;
}
$now=time();
if($action==='upload'){
 $maximum=100*1024*1024;$requestLength=(int)($_SERVER['CONTENT_LENGTH']??0);
 if($requestLength>$maximum+1024*1024)fail('Choose an audio file smaller than 100 MB.',413);
 $file=$_FILES['file']??null;
 if(!is_array($file)||!isset($file['error'],$file['size'],$file['tmp_name'],$file['name']))fail('Choose an audio file to upload.');
 if($file['error']!==UPLOAD_ERR_OK)fail($file['error']===UPLOAD_ERR_INI_SIZE||$file['error']===UPLOAD_ERR_FORM_SIZE?'Audio file exceeds the server upload limit.':'Audio upload failed.',413);
 $size=(int)$file['size'];$extension=strtolower(pathinfo((string)$file['name'],PATHINFO_EXTENSION));$mime=audioMime($extension);
 if(!$mime)fail('Use an MP3, WAV, M4A, OGG, FLAC, or AAC audio file.',415);
 if($size<1||$size>$maximum)fail('Choose an audio file smaller than 100 MB.',413);
 if(!is_uploaded_file((string)$file['tmp_name']))fail('Invalid uploaded file.');
 if(function_exists('finfo_open')){$finfo=finfo_open(FILEINFO_MIME_TYPE);$detected=$finfo?finfo_file($finfo,(string)$file['tmp_name']):false;if($finfo)finfo_close($finfo);if(is_string($detected)&&!str_starts_with($detected,'audio/')&&!in_array($detected,['application/octet-stream','video/mp4'],true))fail('The selected file is not recognized as audio.',415);}
 $remoteAddress=$_SERVER['REMOTE_ADDR']??'';$packedAddress=is_string($remoteAddress)?@inet_pton($remoteAddress):false;
 if($packedAddress===false)fail('Audio upload is unavailable.',503);
 if(strlen($packedAddress)===16)$packedAddress=substr($packedAddress,0,8);
 if(!is_dir($privateDir)&&!@mkdir($privateDir,0700,true)&&!is_dir($privateDir))fail('Audio upload storage is unavailable.',503);
 if(!is_dir($uploadDir)&&!@mkdir($uploadDir,0700,true)&&!is_dir($uploadDir))fail('Audio upload storage is unavailable.',503);
 $secretPath=$privateDir.'/upload-rate.key';$secret=@file_get_contents($secretPath);
 if($secret===false){$secret=random_bytes(32);if(file_put_contents($secretPath,$secret,LOCK_EX)===false)fail('Audio upload is unavailable.',503);@chmod($secretPath,0600);}
 if(strlen($secret)!==32)fail('Audio upload is unavailable.',503);
 $addressKey=hash_hmac('sha256',$packedAddress,$secret);$gate=fopen($privateDir.'/upload.lock','c+');
 if(!$gate||!flock($gate,LOCK_EX))fail('Audio upload storage is busy.',503);
 $now=time();$expires=$now+90*86400;$used=0;
 foreach(glob($uploadDir.'/*.json')?:[] as $metaPath){$meta=json_decode((string)@file_get_contents($metaPath),true);$dataPath=substr($metaPath,0,-5).'.bin';if(!is_array($meta)||!is_int($meta['expires']??null)||$meta['expires']<=$now){@unlink($metaPath);@unlink($dataPath);continue;}$used+=(int)($meta['size']??0);}
 if($used+$size>2*1024*1024*1024){flock($gate,LOCK_UN);fclose($gate);fail('Shared audio storage is full. Try again later.',507);}
 $ratesPath=$privateDir.'/upload-rates.json';$rates=json_decode((string)@file_get_contents($ratesPath),true);if(!is_array($rates))$rates=[];
 foreach($rates as $key=>$timestamps){if(!is_array($timestamps)){unset($rates[$key]);continue;}$recent=array_values(array_filter($timestamps,fn($timestamp)=>is_int($timestamp)&&$timestamp>$now-86400));if($recent)$rates[$key]=$recent;else unset($rates[$key]);}
 $addressUploads=$rates[$addressKey]??[];
 if(count($addressUploads)>=20){flock($gate,LOCK_UN);fclose($gate);fail('Too many audio uploads from this network. Try again tomorrow.',429);}
 $id=bin2hex(random_bytes(24));$dataPath=$uploadDir.'/'.$id.'.bin';$metaPath=$uploadDir.'/'.$id.'.json';
 if(!move_uploaded_file((string)$file['tmp_name'],$dataPath)){flock($gate,LOCK_UN);fclose($gate);fail('Audio file could not be stored.',503);}
 @chmod($dataPath,0600);$metadata=['size'=>$size,'mime'=>$mime,'extension'=>$extension,'created'=>$now,'expires'=>$expires];
 if(file_put_contents($metaPath,json_encode($metadata),LOCK_EX)===false){@unlink($dataPath);flock($gate,LOCK_UN);fclose($gate);fail('Audio upload could not be recorded.',503);}
 @chmod($metaPath,0600);$addressUploads[]=$now;$rates[$addressKey]=$addressUploads;$encodedRates=json_encode($rates);
 if(!is_string($encodedRates)||file_put_contents($ratesPath,$encodedRates,LOCK_EX)===false){@unlink($metaPath);@unlink($dataPath);flock($gate,LOCK_UN);fclose($gate);fail('Audio upload could not be recorded.',503);}
 @chmod($ratesPath,0600);flock($gate,LOCK_UN);fclose($gate);
 $hostHeader=$_SERVER['HTTP_HOST']??'';$host=parse_url('http://'.$hostHeader,PHP_URL_HOST);$serverName=$_SERVER['SERVER_NAME']??'';
 if(!is_string($host)||$serverName===''||strcasecmp($host,$serverName)!==0){@unlink($metaPath);@unlink($dataPath);fail('Audio upload host is invalid.',400);}
 $scheme=!empty($_SERVER['HTTPS'])&&strtolower((string)$_SERVER['HTTPS'])!=='off'?'https':'http';
 echo json_encode(['ok'=>true,'url'=>$scheme.'://'.$hostHeader.'/rpdsgrove/api.php?action=media&id='.$id,'expires'=>$expires,'mime'=>$mime],JSON_UNESCAPED_SLASHES);exit;
}
if ($action==='create') {
 // Bound anonymous room creation globally; public controllers cannot overwrite receiver state.
 $gate=fopen($dir.'/creation.lock','c+'); if(!$gate||!flock($gate,LOCK_EX))fail('Room storage busy.',503);
 $rooms=glob($dir.'/*.json')?:[];
 foreach($rooms as $f){$old=json_decode((string)@file_get_contents($f),true);if(is_array($old)&&(($old['ended']??false)||max($old['created']??0,$old['seen']??0)<$now-86400))@unlink($f);}
 if(count(glob($dir.'/*.json')?:[])>=100){flock($gate,LOCK_UN);fclose($gate);fail('Room limit reached. Try again later.',429);}
 $remoteAddress=$_SERVER['REMOTE_ADDR']??'';$packedAddress=is_string($remoteAddress)?@inet_pton($remoteAddress):false;
 if($packedAddress===false){flock($gate,LOCK_UN);fclose($gate);fail('Room creation is unavailable.',503);}
 if(strlen($packedAddress)===16)$packedAddress=substr($packedAddress,0,8);
 $secretFile=$dir.'/creation-rate.key';$rateSecret=@file_get_contents($secretFile);
 if($rateSecret===false){$rateSecret=random_bytes(32);if(file_put_contents($secretFile,$rateSecret,LOCK_EX)===false){flock($gate,LOCK_UN);fclose($gate);fail('Room creation is unavailable.',503);}@chmod($secretFile,0600);}
 if(strlen($rateSecret)!==32){flock($gate,LOCK_UN);fclose($gate);fail('Room creation is unavailable.',503);}
 $rateFile=$dir.'/creation-rates.dat';$rates=json_decode((string)@file_get_contents($rateFile),true);if(!is_array($rates))$rates=[];
 foreach($rates as $key=>$timestamps){if(!is_array($timestamps)){unset($rates[$key]);continue;}$recent=array_values(array_filter($timestamps,fn($time)=>is_int($time)&&$time>$now-3600));if($recent)$rates[$key]=$recent;else unset($rates[$key]);}
 $clientKey=hash_hmac('sha256',$packedAddress,$rateSecret);$clientCreations=$rates[$clientKey]??[];
 if(count($clientCreations)>=10){flock($gate,LOCK_UN);fclose($gate);fail('Too many rooms created from this network. Try again later.',429);}
 $room=bin2hex(random_bytes(12));$token=bin2hex(random_bytes(32));
 $r=['owner'=>hash('sha256',$token),'created'=>$now,'seen'=>0,'seq'=>0,'commands'=>[],'status'=>[],'commandTimes'=>[]];
 $ok=file_put_contents($dir.'/'.$room.'.json',json_encode($r),LOCK_EX);@chmod($dir.'/'.$room.'.json',0600);
 if($ok===false){flock($gate,LOCK_UN);fclose($gate);fail('Room could not be created.',503);}
 $clientCreations[]=$now;$rates[$clientKey]=$clientCreations;$rateJson=json_encode($rates);
 if(!is_string($rateJson)||file_put_contents($rateFile,$rateJson,LOCK_EX)===false){@unlink($dir.'/'.$room.'.json');flock($gate,LOCK_UN);fclose($gate);fail('Room creation is unavailable.',503);}
 @chmod($rateFile,0600);flock($gate,LOCK_UN);fclose($gate);
 echo json_encode(['room'=>$room,'token'=>$token]);exit;
}
$room=$b['room']??'';
if(!is_string($room)||!preg_match('/^[a-f0-9]{24}$/D',$room))fail('Invalid room code.');
$file=$dir.'/'.$room.'.json';
if(!is_file($file))fail('Room not found or ended.',404);
$fh=fopen($file,'r+');if(!$fh||!flock($fh,LOCK_EX))fail('Room temporarily unavailable.',503);
$r=json_decode(stream_get_contents($fh),true);if(!is_array($r))fail('Room unavailable.',503);
if(($r['ended']??false)||max($r['created'],$r['seen'])<$now-86400)fail('Room expired or ended.',410);
$isOwner=is_string($b['token']??null)&&hash_equals($r['owner'],hash('sha256',$b['token']));
$result=[];
if($action==='heartbeat'){
 if(!$isOwner)fail('Player authorization required.',403);
 $s=is_array($b['status']??null)?$b['status']:[];
 $r['status']=['title'=>substr((string)($s['title']??''),0,160),'stopped'=>($s['stopped']??false)===true,'song'=>song($s['song']??null),'queue'=>ids($s['queue']??[]),'position'=>number($s['position']??0,0,86400),'duration'=>number($s['duration']??0,0,86400),'volume'=>number($s['volume']??0.7,0,1),'paused'=>($s['paused']??true)!==false,'shuffle'=>($s['shuffle']??false)===true,'repeat'=>(int)number($s['repeat']??0,0,2),'output'=>substr((string)($s['output']??'This device'),0,100)];
 $r['seen']=$now;$after=(int)($b['after']??0);
 $r['commands']=array_values(array_filter($r['commands'],fn($c)=>$c['id']>$after&&$c['time']>$now-30));
 $result=['commands'=>$r['commands']];
}elseif($action==='status'){
 $result=['online'=>$r['seen']>$now-12,'status'=>(object)$r['status']];
}elseif($action==='command'){
 if($r['seen']<$now-12)fail('The player is offline or asleep. Open its RPDsGrove page first.',409);
 $type=$b['type']??'';
 if(!in_array($type,['play','stop','toggle','next','previous','seek','volume','enqueue','clearQueue','removeQueue','shuffle','repeat'],true))fail('Unknown control.');
 $r['commandTimes']=array_values(array_filter($r['commandTimes'],fn($t)=>$t>$now-10));
 if(count($r['commandTimes'])>=30)fail('Too many controls. Try again in a moment.',429);
 $c=['id'=>++$r['seq'],'time'=>$now,'type'=>$type];
 if($type==='play'||$type==='enqueue'){$c['song']=song($b['song']??null);if(!$c['song'])fail('Invalid SoundBreak song.');}
 if($type==='play')$c['queue']=ids($b['queue']??[]);
 if($type==='seek'||$type==='volume')$c['value']=number($b['value']??0,0,$type==='volume'?1:86400);
 if($type==='removeQueue')$c['index']=(int)number($b['index']??0,0,199);
 $r['commands'][]=$c;$r['commands']=array_slice($r['commands'],-50);$r['commandTimes'][]=$now;$result=['ok'=>true,'sequence'=>$c['id']];
}elseif($action==='end'){
 if(!$isOwner)fail('Player authorization required.',403);
 $r['ended']=true;$r['commands']=[];$r['status']=[];$result=['ok'=>true];
}else fail('Unknown request.');
rewind($fh);ftruncate($fh,0);$written=fwrite($fh,json_encode($r));fflush($fh);flock($fh,LOCK_UN);fclose($fh);
if($written===false)fail('Room update failed.',503);
echo json_encode($result,JSON_UNESCAPED_SLASHES);
