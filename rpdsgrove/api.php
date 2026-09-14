<?php
// Ephemeral remote rooms live outside the public web root. No SoundBreak credentials are stored here.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function fail(string $message, int $code=400): void { http_response_code($code); echo json_encode(['error'=>$message]); exit; }
if ($_SERVER['REQUEST_METHOD']!=='POST') fail('Use POST.',405);
$origin=$_SERVER['HTTP_ORIGIN']??'';
if ($origin!=='' && parse_url($origin,PHP_URL_HOST)!==parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST)) fail('Origin rejected.',403);
if (strpos($_SERVER['CONTENT_TYPE']??'','application/json')!==0) fail('Use JSON.',415);
$raw=file_get_contents('php://input',false,null,0,32769);
if (strlen($raw)>32768) fail('Request too large.',413);
$b=json_decode($raw,true);
if (!is_array($b)) fail('Invalid request.');
$action=$b['action']??'';
$dir=sys_get_temp_dir().'/rpdsgrove-'.substr(hash('sha256',__DIR__),0,16);
if (!is_dir($dir) && !@mkdir($dir,0700,true) && !is_dir($dir)) fail('Room storage unavailable.',503);
function song($s): ?array {
 if (!is_array($s)) return null;
 $url=$s['url']??'';
 if (!is_string($url)||!preg_match('~^https://audio\.soundbreak\.ai/[A-Za-z0-9/_-]+\.mp3$~D',$url)) return null;
 $id=$s['id']??'';if(!is_string($id)||!preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$id))return null;
 return ['id'=>$id,'url'=>$url,'title'=>substr((string)($s['title']??'SoundBreak song'),0,160),'genre'=>substr((string)($s['genre']??'SoundBreak'),0,60),'version'=>substr((string)($s['version']??''),0,40),'art'=>preg_match('/^art-[0-3]\.svg$/D',(string)($s['art']??''))?$s['art']:'art-0.svg'];
}
function ids($a): array {if(!is_array($a))return [];return array_values(array_slice(array_filter($a,fn($v)=>is_string($v)&&preg_match('/^[a-zA-Z0-9-]{1,64}$/D',$v)),0,200));}
function number($v,float $min,float $max): float {return is_numeric($v)?max($min,min($max,(float)$v)):$min;}
$now=time();
if ($action==='create') {
 // Bound anonymous room creation globally; public controllers cannot overwrite receiver state.
 $gate=fopen($dir.'/creation.lock','c+'); if(!$gate||!flock($gate,LOCK_EX))fail('Room storage busy.',503);
 $rooms=glob($dir.'/*.json')?:[];
 foreach($rooms as $f){$old=json_decode((string)@file_get_contents($f),true);if(is_array($old)&&(($old['ended']??false)||max($old['created']??0,$old['seen']??0)<$now-86400))@unlink($f);}
 if(count(glob($dir.'/*.json')?:[])>=100){flock($gate,LOCK_UN);fclose($gate);fail('Room limit reached. Try again later.',429);}
 $room=bin2hex(random_bytes(12));$token=bin2hex(random_bytes(32));
 $r=['owner'=>hash('sha256',$token),'created'=>$now,'seen'=>0,'seq'=>0,'commands'=>[],'status'=>[],'commandTimes'=>[]];
 $ok=file_put_contents($dir.'/'.$room.'.json',json_encode($r),LOCK_EX);@chmod($dir.'/'.$room.'.json',0600);
 flock($gate,LOCK_UN);fclose($gate);if($ok===false)fail('Room could not be created.',503);
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
