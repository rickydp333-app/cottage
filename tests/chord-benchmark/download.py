from pathlib import Path
import io,zipfile,urllib.request,json
class Remote(io.RawIOBase):
 def __init__(self,url,size):self.url=url;self.size=size;self.pos=0
 def seekable(self):return True
 def readable(self):return True
 def tell(self):return self.pos
 def seek(self,n,whence=0):self.pos=n if whence==0 else self.pos+n if whence==1 else self.size+n;return self.pos
 def read(self,n=-1):
  n=self.size-self.pos if n<0 else min(n,self.size-self.pos)
  if n<=0:return b''
  req=urllib.request.Request(self.url,headers={'Range':f'bytes={self.pos}-{self.pos+n-1}'})
  with urllib.request.urlopen(req,timeout=45) as r:
   if r.status!=206:raise RuntimeError('Server did not support range reads')
   b=r.read(n)
  self.pos+=len(b);return b
root=Path('work/benchmark');root.mkdir(exist_ok=True)
audio=zipfile.ZipFile(Remote('https://zenodo.org/api/records/3371780/files/audio_mono-mic.zip/content',656927981))
names=sorted(n for n in audio.namelist() if n.endswith('_comp_mic.wav') and not n.startswith('__MACOSX'))
print('Comp recordings',len(names),names[:8],flush=True)
# Choose one accompaniment per style for players 00 and 01, using filenames only, before scoring.
selected=[]
for player in ['00','01']:
 for style in ['BN','Funk','Jazz','Rock','SS']:
  candidates=[n for n in names if Path(n).name.startswith(player+'_'+style)]
  if candidates:selected.append(candidates[0])
print('Selected',selected,flush=True)
(root/'selection.json').write_text(json.dumps(selected,indent=2))
for n in selected:
 p=root/Path(n).name
 if not p.exists():p.write_bytes(audio.read(n))
 print('Audio',p.name,flush=True)
ann=zipfile.ZipFile(Remote('https://zenodo.org/api/records/3371780/files/annotation.zip/content',39132574))
for n in selected:
 stem=Path(n).name.replace('_mic.wav','.jams');match=next(n for n in ann.namelist() if Path(n).name==stem)
 (root/stem).write_bytes(ann.read(match));print('Annotation',stem,flush=True)
