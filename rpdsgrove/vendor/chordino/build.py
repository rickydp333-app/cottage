"""Build using em++ from Emscripten 4.0.22. No downloads or global installs."""
from pathlib import Path
import os,subprocess
root=Path(__file__).resolve().parent
compiler=os.environ.get('EMXX','em++')
files=['browser-host.cpp','Chordino.cpp','NNLSBase.cpp','chromamethods.cpp','nnls.c','viterbi.cpp','RealTime.cpp']
subprocess.run([compiler,*[str(root/'src'/f) for f in files],'-I'+str(root/'src'),'-O3','-std=c++17','-Wno-deprecated','-Wno-deprecated-declarations','-sMODULARIZE=1','-sEXPORT_NAME=createChordino','-sSINGLE_FILE=1','-sENVIRONMENT=worker,node','-sALLOW_MEMORY_GROWTH=1','-sMAXIMUM_MEMORY=536870912','-sEXPORTED_FUNCTIONS=["_grove_begin","_grove_frame","_grove_finish","_grove_time","_grove_label","_malloc","_free"]','-sEXPORTED_RUNTIME_METHODS=["UTF8ToString","HEAPF32"]','-o',str(root/'chordino.js')],check=True)
