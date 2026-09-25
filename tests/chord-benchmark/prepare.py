import sys,json
from pathlib import Path
sys.path.insert(0,'work/python-audio')
import numpy as np,soundfile as sf
root=Path('work/benchmark');meta=[]
for p in sorted(root.glob('*.wav')):
 x,sr=sf.read(p,always_2d=True);x=x.mean(axis=1)
 assert sr==44100
 for rate,step in [(22050,2),(11025,4)]:
  cutoff=.9/step;k=np.arange(-64,65);h=cutoff*np.sinc(cutoff*k)*np.hanning(129);h/=h.sum()
  y=np.convolve(x,h,mode='same')[::step].astype('float32');y.tofile(root/(p.stem+f'-{rate}.f32'))
 d=json.loads((root/p.name.replace('_mic.wav','.jams')).read_text())
 chords=[a for a in d['annotations'] if a['namespace']=='chord'][0]['data']
 meta.append({'file':p.stem,'duration':len(x)/sr,'reference':chords})
(root/'reference.json').write_text(json.dumps(meta))
print('Prepared',len(meta),'real recordings and unchanged reference chord charts.')
