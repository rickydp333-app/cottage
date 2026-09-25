// Browser host for Chordino. Copyright 2026. GPL-2.0-or-later.
// The chord-recognition algorithm is the upstream Chordino implementation.
#include "Chordino.h"
#include <cmath>
#include <memory>
#include <vector>
#include <emscripten/emscripten.h>

static std::unique_ptr<Chordino> plugin;
static Vamp::Plugin::FeatureList result;
static int blockSize=16384;
static float sampleRate=44100;
static std::vector<double> realPart,imagPart,windowValues;
static std::vector<float> frequencyInput;
extern "C" {
EMSCRIPTEN_KEEPALIVE int grove_begin(int rate,int hop,int block) {
    if(rate<8000||rate>96000||block<1024||block>32768||(block&(block-1))||hop<1||hop>block)return 0;
    sampleRate=rate;blockSize=block;result.clear();
    plugin.reset(new Chordino(rate));
    plugin->getOutputDescriptors();
    if(!plugin->initialise(1,hop,block))return 0;
    realPart.resize(block);imagPart.resize(block);windowValues.resize(block);frequencyInput.resize(block+2);
    for(int i=0;i<block;i++)windowValues[i]=.5-.5*std::cos(2*M_PI*i/block);
    return 1;
}
EMSCRIPTEN_KEEPALIVE void grove_frame(const float* samples,int frame) {
    if(!plugin||!samples)return;
    const int n=blockSize;
    for(int i=0;i<n;i++){realPart[i]=samples[i]*windowValues[i];imagPart[i]=0;}
    for(int i=1,j=0;i<n;i++){int bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)std::swap(realPart[i],realPart[j]);}
    for(int length=2;length<=n;length<<=1){double angle=-2*M_PI/length,cr=std::cos(angle),ci=std::sin(angle);
        for(int start=0;start<n;start+=length){double wr=1,wi=0;
            for(int j=0;j<length/2;j++){int a=start+j,b=a+length/2;double tr=wr*realPart[b]-wi*imagPart[b],ti=wr*imagPart[b]+wi*realPart[b];realPart[b]=realPart[a]-tr;imagPart[b]=imagPart[a]-ti;realPart[a]+=tr;imagPart[a]+=ti;double next=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=next;}
        }
    }
    for(int i=0;i<=n/2;i++){frequencyInput[2*i]=realPart[i];frequencyInput[2*i+1]=imagPart[i];}
    const float* channels[]={frequencyInput.data()};
    plugin->process(channels,Vamp::RealTime::frame2RealTime(frame,(unsigned int)sampleRate));
}
EMSCRIPTEN_KEEPALIVE int grove_finish(){if(!plugin)return 0;result=plugin->getRemainingFeatures()[0];plugin.reset();return result.size();}
EMSCRIPTEN_KEEPALIVE double grove_time(int i){if(i<0||i>=(int)result.size())return -1;return result[i].timestamp.sec+result[i].timestamp.nsec/1e9;}
EMSCRIPTEN_KEEPALIVE const char* grove_label(int i){if(i<0||i>=(int)result.size())return "N";return result[i].label.c_str();}
}
