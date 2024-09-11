"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mic, Upload, Moon, Sun, Camera, Zap, Sparkles, Wand2,  ChartBar, Search } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
// MessageCircle,
export function FslakwsInterface() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [threatLevel, setThreatLevel] = useState<'safe' | 'caution' | 'threat' | null>(null)
  const [metrics, setMetrics] = useState({ accuracy: 0, latency: 0, throughput: 0 })
  const [suggestedActions, setSuggestedActions] = useState<string[]>([])
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [transcription, setTranscription] = useState('Start Recording to see live transcription...')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStreamAudioSourceNode | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const transcriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // WebSocket setup would go here
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [transcription])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsProcessing(true)
      // Simulating processing
      setTimeout(() => {
        setIsProcessing(false)
        updateResults()
      }, 3000)
    }
  }

  const handleRecordToggle = async () => {
    if (isRecording) {
      setIsRecording(false)
      setIsProcessing(true)
      if (micStreamRef.current) {
        micStreamRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      // Simulating processing
      setTimeout(() => {
        setIsProcessing(false)
        updateResults()
      }, 3000)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        micStreamRef.current = audioContextRef.current.createMediaStreamSource(stream)
        micStreamRef.current.connect(analyserRef.current)

        setIsRecording(true)
        updateVolumeMeter()
        startTranscription()
      } catch (error) {
        console.error('Error accessing microphone:', error)
      }
    }
  }

  const updateVolumeMeter = () => {
    const dataArray = analyserRef.current ? new Uint8Array(analyserRef.current.frequencyBinCount) : new Uint8Array(0);
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArray)
    }
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const volume = Math.min(100, Math.round((average / 255) * 100))
    // console.log(volume)

    setVolumeLevel(volume)

    requestAnimationFrame(updateVolumeMeter)

  }

  const startTranscription = () => {
    if ('webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        setTranscription(finalTranscript || interimTranscript)
      }

      recognitionRef.current.start()
    } else {
      console.error('Web Speech API is not supported in this browser')
    }
  }

  const updateResults = () => {
    const randomThreat = Math.random()
    if (randomThreat < 0.33) {
      setThreatLevel('safe')
      setSuggestedActions(['Continue monitoring', 'Log results'])
    } else if (randomThreat < 0.66) {
      setThreatLevel('caution')
      setSuggestedActions(['Increase surveillance', 'Notify supervisor'])
    } else {
      setThreatLevel('threat')
      setSuggestedActions(['Immediate action required', 'Alert authorities', 'Initiate lockdown procedures'])
    }
    setMetrics({
      accuracy: Math.random() * 100,
      latency: Math.random() * 1000,
      throughput: Math.random() * 100
    })
  }

  const CircularProgress = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-300 dark:text-gray-700 stroke-current"
          strokeWidth="10"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
        ></circle>
        <circle
          className={`${color} progress-ring__circle stroke-current`}
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - value / 100)}`}
        ></circle>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(value)}%</span>
        <span className="text-xs">{label}</span>
      </div>
    </div>
  )


  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} p-8 transition-colors duration-200`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">FSLAKWS System</h1>
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4" />
          <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          <Moon className="h-4 w-4" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className={isDarkMode ? "bg-gray-800" : "bg-white"}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-blue-400 text-2xl" : "text-blue-600 text-2xl"}>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-4" />
              <p>Drag and drop an audio file or click to upload</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="audio/*"
              />
            </div>
            <Button
              className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleRecordToggle}
            >
              <Mic className="mr-2" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <div className="mt-4 space-y-2">
              {isRecording && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Volume Level</h3>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100 ease-out"
                      style={{ width: `${volumeLevel}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium mb-1">Live Transcription</h3>
                <div
                  ref={transcriptionRef}
                  className={`text-sm ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-200'} h-32 overflow-y-auto rounded p-4 whitespace-pre-wrap`}
                >
                  {transcription}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? "bg-gray-800" : "bg-white"}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-green-400 text-2xl" : "text-green-600 text-2xl"}>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProcessing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Processing audio...</p>
              </div>
            ) : threatLevel ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Threat Level:</span>
                  <div className={`px-3 py-1 rounded-full ${threatLevel === 'safe' ? 'bg-green-500' :
                      threatLevel === 'caution' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                    {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Metrics:</h3>
                  <div className="space-y-2">
                    <div>
                      <span>Accuracy:</span>
                      <Progress value={metrics.accuracy} className="mt-1" />
                    </div>
                    <div>
                      <span>Latency:</span>
                      <Progress value={metrics.latency / 10} className="mt-1" />
                    </div>
                    <div>
                      <span>Throughput:</span>
                      <Progress value={metrics.throughput} className="mt-1" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Suggested Actions:</h3>
                  <ul className="list-disc pl-5">
                    {suggestedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">No results to display</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        <Card className="col-span-2 row-span-2 bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-blue-700 dark:to-cyan-600 text-white overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-2xl font-bold mb-2">Audio Processing</h3>
              <p className="text-sm opacity-80">Analyze and transcribe audio in real-time</p>
            </div>
            <div className="mt-4">
              <CircularProgress value={75} label="accurate" color="text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-700 dark:to-pink-700 text-white overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <Zap className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-semibold text-center">Fast Processing</h3>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-700 dark:to-emerald-700 text-white overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <Sparkles className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-semibold text-center">High Accuracy</h3>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-600 dark:to-orange-700 text-white overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between h-full">
            <div>
              <h3 className="text-xl font-bold mb-2">User Satisfaction</h3>
              <p className="text-sm opacity-80">Our users love the results</p>
            </div>
            <CircularProgress value={92} label="Satisfied" color="text-white" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-pink-500 dark:from-red-700 dark:to-pink-700 text-white overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <Wand2 className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-semibold text-center">AI-Powered</h3>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <Camera className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-semibold text-center">Multi-lingual</h3>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-700 dark:to-orange-700 text-white overflow-hidden">
  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
    <Search className="w-8 h-8 mb-2" />
    <h3 className="text-lg font-semibold text-center">Keyword Spotting</h3>
    <p className="text-sm opacity-80 text-center">Efficiency analysis</p>
  </CardContent>
</Card>
<Card className="bg-gradient-to-br from-teal-500 to-blue-500 dark:from-teal-700 dark:to-blue-700 text-white overflow-hidden">
  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
    <ChartBar className="w-8 h-8 mb-2" />
    <h3 className="text-lg font-semibold text-center">Real-Time Insights</h3>
    <p className="text-sm opacity-80 text-center">Monitor ongoing analysis</p>
  </CardContent>
</Card>
      </div>
    </div>
  )
}