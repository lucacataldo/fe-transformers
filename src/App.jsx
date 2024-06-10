import { Box, TextField, Button, CircularProgress, Card, LinearProgress } from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react"

function App() {
    const inputRef = useRef(null);

    const [worker, setWorker] = useState(null)
    const [input, setInput] = useState("")
    const [loadingModels, setLoadingModels] = useState(true)
    const [loadingResult, setLoadingResult] = useState(false)
    const [classificationResult, setClassificationResult] = useState(null)
    const [summarizationResult, setSummarizationResult] = useState(null)

    const disableButtons = useMemo(() => {return loadingModels || loadingResult}, [loadingModels, loadingResult])

    useEffect(() => {
        const storedInput = localStorage.getItem("transformers-input")

        console.log("Stored input", storedInput);

        if (storedInput) {
            setInput(storedInput)

            inputRef.current.value = storedInput
        }

        setLoadingModels(true)
        const newWorker = new Worker(new URL("./worker.js", import.meta.url), {
            type: "module"
        })

        setWorker(newWorker)


        newWorker.onmessage = (e) => {
            const { type, payload } = e.data

            switch (type) {
            case "initResult":
                console.log("Worker initialized")
                setLoadingModels(false)
                break
            case "summarizeResult":
                setSummarizationResult(payload)
                break
            case "classifyResult":
                setClassificationResult(payload)
                break
            default:
                break
            }

            setLoadingResult(false)
        }

        newWorker.postMessage({ type: "init" })


        return () => {
            newWorker.terminate()
        }
    }, [])


    const handleInputChanged = (e) => {
        setInput(e.target.value)

        // store the input in local storage
        localStorage.setItem("transformers-input", e.target.value)


    }

    return (
        <Box sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: 2
        }}>
            <TextField 
                inputRef={inputRef}
                InputLabelProps={{
                    shrink: true
                }}
                onChange={handleInputChanged} 
                multiline rows={15} label="Text Input" 
                sx={{
                    width: "80%"
                }}
            />

            <Button 
                onClick={()=>{
                    setLoadingResult(true)
                    worker.postMessage({ type: "summarize", payload: input })
                }}
                disabled={disableButtons}
                variant="contained"
            >
                Summarize
            </Button>
            <Button 
                onClick={()=>{
                    setLoadingResult(true)
                    setClassificationResult(null)
                    worker.postMessage({ type: "classify", payload: input })
                }}
                disabled={disableButtons}
                variant="contained"
            >
                Classify
            </Button>

            {
                loadingModels && (
                    <span>
                        <CircularProgress size={'1em'} /> 
                        {" "}
                        Loading models...
                    </span>
                )
            }

            {
                loadingResult && (
                    <CircularProgress />
                )
            }

            {summarizationResult && (
                <Box>
                    <h2>Summarization Result</h2>
                    <p>{summarizationResult}</p>
                </Box>
            
            )}

            {classificationResult && (
                <Box>
                    <h2>Classification Result</h2>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2, 
                        justifyContent: 'center'
                    }}>
                        {classificationResult.labels.map((label, index) => (
                            <Card
                                key={label}
                                variant="outlined"
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 2,
                                    width: '200px',
                                    gap: 2,
                                    textTransform: 'capitalize'
                                }}
                            >
                                <h3>{label}</h3>
                                <LinearProgress
                                    variant="determinate"
                                    sx={{
                                        flexShrink: 0,
                                        alignSelf: 'stretch',
                                    }}
                                    value={classificationResult.scores[index] * 100}
                                />
                                {parseInt(classificationResult.scores[index] * 100)}%{" "}
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    )
}

export default App
